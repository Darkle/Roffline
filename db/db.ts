import * as R from 'ramda'
import { Sequelize, Transaction, Op } from 'sequelize'
import { match } from 'ts-pattern'
import { Timer } from 'timer-node'
// import { Maybe, get as MaybeGet, Just, Nothing, nullable as MaybeNullable } from 'pratica'

import { SubredditsMasterListModel } from './entities/SubredditsMasterList'
import { firstRun } from './db-first-run'
import { noop, omitDuplicateSubs } from '../server/utils'
import { dbLogger, mainLogger } from '../logging/logging'
import { UpdatesTrackerModel } from './entities/UpdatesTracker'
import { User, UserModel } from './entities/Users'
import { Post, PostModel } from './entities/Posts'
import {
  createAndSyncSubredditTable,
  loadSubredditTableModels,
  removeSubredditTable,
} from './entities/SubredditTable'
import {
  getPostsPaginated,
  getPostsPaginatedForSubreddit,
  getTopPostsPaginated,
  getTopPostsPaginatedForSubreddit,
} from './db-get-posts-paginated'
import { searchPosts, SearchLimitedPostType } from './db-search-posts'

const dbPath = process.env['DBPATH'] || './roffline-storage.db'

type TransactionType = Transaction | null | undefined
type TopFilterType = 'day' | 'week' | 'month' | 'year' | 'all'

/*****
  Notes:
    * Until this (https://github.com/sequelize/sequelize/issues/12575) is fixed, we have to map
      over results and use .get() to get raw objects instead of model instances
    * Gotta use getterMethods and setterMethods instead of regular get()/set() in classes because of
        this: https://github.com/sequelize/sequelize/issues/8953
*****/

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: (msg): void => mainLogger.trace(msg),
})

const db = {
  sequelize,
  init(): Promise<void> {
    return firstRun(sequelize).then(() => loadSubredditTableModels(sequelize))
  },
  close(): Promise<void> {
    return sequelize.close()
  },
  getLastScheduledUpdateTime(): Promise<string> {
    return UpdatesTrackerModel.findByPk(1, { attributes: ['lastUpdateDateAsString'] }).then(
      item => item?.get('lastUpdateDateAsString') as string
    )
  },
  async setLastScheduledUpdateTime(date: string | Date): Promise<void> {
    await UpdatesTrackerModel.update({ lastUpdateDateAsString: date }, { where: { id: 1 } })
  },
  async createUser(userName: string): Promise<void> {
    await UserModel.create({ name: userName }, { ignoreDuplicates: true })
  },
  getUserSettings(userName: string): Promise<User> {
    return UserModel.findOne({ where: { name: userName } }).then(userAsModel => userAsModel?.get() as User)
  },
  getUserSpecificSetting(userName: string, settingName: keyof User): Promise<User[keyof User]> {
    return UserModel.findOne({ where: { name: userName }, attributes: [settingName] }).then(
      user => user?.get(settingName) as User[keyof User]
    )
  },
  getUserSubreddits(userName: string): Promise<User[keyof User]> {
    return this.getUserSpecificSetting(userName, 'subreddits')
  },
  async setUserSpecificSetting(
    userName: string,
    settingName: keyof User,
    settingValue: User[keyof User]
  ): Promise<void> {
    const updateDetails = {
      settingName,
      settingValIsArray: Array.isArray(settingValue),
    }

    await match(updateDetails)
      .with({ settingName: 'subreddits', settingValIsArray: false }, () =>
        db.addUserSubreddit(userName, settingValue as string)
      )
      .with({ settingName: 'subreddits', settingValIsArray: true }, () =>
        db.batchAddUserSubreddits(userName, settingValue as string[])
      )
      .otherwise(() => UserModel.update({ [settingName]: [settingValue] }, { where: { name: userName } }))
  },
  async batchAddUserSubreddits(
    userName: string,
    subreddits: string[],
    transaction: TransactionType = null
  ): Promise<void> {
    const userSubs = await db.getUserSubreddits(userName)

    await UserModel.update(
      { subreddits: omitDuplicateSubs(userSubs as string[], subreddits) },
      { where: { name: userName }, transaction }
    )
  },
  addUserSubreddit(userName: string, subreddit: string, transaction: TransactionType = null): Promise<void> {
    return db.batchAddUserSubreddits(userName, [subreddit], transaction)
  },
  getAllUsersSubredditsBarOneUser(userToOmit: string, transaction: TransactionType = null): Promise<string[]> {
    return UserModel.findAll({
      attributes: ['subreddits'],
      where: { name: { [Op.not]: userToOmit } },
      transaction,
    }).then((users): string[] =>
      users.flatMap(userModelSubsAttr => userModelSubsAttr.get('subreddits') as string[])
    )
  },
  // eslint-disable-next-line max-lines-per-function
  async removeUserSubreddit(userName: string, subreddit: string): Promise<void> {
    const subredditToRemove = subreddit.toLowerCase()

    const removeSubFromUser = async (userSubs: string[], transaction: Transaction): Promise<void> => {
      await UserModel.update(
        { subreddits: R.without([subredditToRemove], userSubs) },
        { where: { name: userName }, transaction }
      )
    }

    const noOtherUserHasSubreddit = (allUsersSubs: string[], subToRemove: string): boolean =>
      !allUsersSubs.includes(subToRemove)

    await sequelize
      .transaction(async transaction => {
        await this.getUserSubreddits(userName).then((maybeUserSubs: User[keyof User]) =>
          removeSubFromUser(maybeUserSubs as string[], transaction)
        )

        return this.getAllUsersSubredditsBarOneUser(userName, transaction)
      })
      .then(allUsersSubreddits =>
        noOtherUserHasSubreddit(allUsersSubreddits, subredditToRemove)
          ? removeSubredditTable(subredditToRemove)
          : noop()
      )
  },
  getAllSubreddits(): Promise<string[]> {
    return SubredditsMasterListModel.findAll({ attributes: ['subreddit'] }).then(subs =>
      subs.map(subModelAttr => subModelAttr.get('subreddit') as string)
    )
  },
  async batchAddSubredditsToMasterList(subreddits: string[], transaction: TransactionType = null): Promise<void> {
    const subs = subreddits.map(subreddit => ({ subreddit }))

    await SubredditsMasterListModel.bulkCreate(subs, {
      ignoreDuplicates: true,
      fields: ['subreddit'],
      transaction,
    })
  },
  async addSingleSubredditToMasterList(newSub: string, transaction: TransactionType = null): Promise<void> {
    await SubredditsMasterListModel.create(
      { subreddit: newSub },
      { ignoreDuplicates: true, fields: ['subreddit'], transaction }
    )
  },
  async addSubreddit(userName: string, newSub: string): Promise<void> {
    await sequelize.transaction(transaction =>
      Promise.all([
        db.addSingleSubredditToMasterList(newSub, transaction),
        db.addUserSubreddit(userName, newSub, transaction),
        createAndSyncSubredditTable(newSub, sequelize, transaction),
      ])
    )
  },
  async batchAddSubreddits(userName: string, subsToAdd: string[]): Promise<void> {
    await sequelize.transaction(transaction =>
      Promise.all([
        db.batchAddSubredditsToMasterList(subsToAdd, transaction),
        db.batchAddUserSubreddits(userName, subsToAdd, transaction),
        ...subsToAdd.map(sub => createAndSyncSubredditTable(sub, sequelize, transaction)),
      ])
    )
  },
  getSinglePostData(postId: string): Promise<Post> {
    return PostModel.findByPk(postId).then(post => post?.get() as Post)
  },
  getPostsPaginated(page = 1, topFilter: null | TopFilterType = null): Promise<{ count: number; rows: Post[] }> {
    return topFilter ? getTopPostsPaginated(page, topFilter) : getPostsPaginated(page)
  },
  getPostsPaginatedForSubreddit(
    subreddit: string,
    page = 1,
    topFilter: null | TopFilterType = null
  ): Promise<{ count: number; rows: Post[] }> {
    return topFilter
      ? getTopPostsPaginatedForSubreddit(subreddit, page, topFilter)
      : getPostsPaginatedForSubreddit(subreddit, page)
  },
  searchPosts(
    searchTerm: string,
    page = 1,
    fuzzySearch = false
  ): Promise<{ rows: SearchLimitedPostType[]; count: number }> {
    return searchPosts(sequelize, searchTerm, page, fuzzySearch)
  },
  getAllPostIds(): Promise<string[]> {
    return PostModel.findAll({ attributes: ['postId'] }).then(items =>
      items.map(item => item.get('postId') as string)
    )
  },
  getPostIdsWithNoCommentsYetFetched(): Promise<string[]> {
    return PostModel.findAll({ where: { commentsDownloaded: false }, attributes: ['postId'] }).then(items =>
      items.map(item => item.get('postId') as string)
    )
  },
  getPostsWithMediaStillToDownload(): Promise<Post[]> {
    return PostModel.findAll({ where: { media_has_been_downloaded: false }, attributes: ['postId'] }).then(
      items => items.map(item => item.get() as Post)
    )
  },
  getCountOfAllPostsWithMediaStillToDownload(): Promise<number> {
    return PostModel.count({ where: { media_has_been_downloaded: false }, attributes: ['postId'] })
  },
  async setMediaDownloadedTrueForPost(postId: string): Promise<void> {
    await PostModel.update({ media_has_been_downloaded: true }, { where: { postId } })
  },
  async incrementPostMediaDownloadTry(postId: string): Promise<void> {
    await PostModel.increment('mediaDownloadTries', { where: { postId } })
  },
  async batchRemovePosts(postsToRemove: string[]): Promise<void> {
    await PostModel.destroy({ where: { postId: { [Op.in]: postsToRemove } } })
  },
  // eslint-disable-next-line max-lines-per-function
  async batchAddNewPosts(postsToAdd: Post[]): Promise<void> {
    // eslint-disable-next-line functional/no-conditional-statement
    if (R.isEmpty(postsToAdd)) return Promise.resolve()

    const timer = new Timer()
    timer.start()

    const postsInDB: string[] = await sequelize.transaction(transaction =>
      PostModel.findAll({ attributes: ['postId'], transaction }).then(items =>
        items.map(item => item.get('postId') as string)
      )
    )

    const numNewPostsSansExisting = R.differenceWith(
      (x: Post, postId: string) => x.postId === postId,
      postsToAdd,
      postsInDB
    ).length

    await PostModel.bulkCreate(postsToAdd, { ignoreDuplicates: true, validate: true })

    dbLogger.debug(
      `db.batchAddNewPosts knex.batchInsert for ${numNewPostsSansExisting} posts took ${timer.format(
        '[%s] seconds [%ms] ms'
      )} to complete`
    )

    timer.clear()
  },
}

export { db }

setTimeout(() => {
  // PostModel.create({
  //   postId: 'asd',
  //   subreddit: 'aww',
  //   author: 'foo',
  //   title: 'the return of christ',
  //   score: 99, // eslint-disable-line @typescript-eslint/no-magic-numbers
  //   created_utc: 1,
  //   domain: 'foo.com',
  //   permalink: '/r/foo',
  //   url: 'http://google.com',
  // }).catch(err => console.error(err))
  // const arrayLength = 5000
  // db.batchAddNewPosts(
  //   // @ts-expect-error
  //   Array.from({ length: arrayLength }, (_, i) => ({
  //     postId: i,
  //     subreddit: 'aww',
  //     author: 'foo',
  //     title: 'the return of christ',
  //     score: 99, // eslint-disable-line @typescript-eslint/no-magic-numbers
  //     created_utc: 1,
  //     domain: 'foo.com',
  //     permalink: '/r/foo',
  //     url: 'http://google.com',
  //   }))
  // )
  //   // .then(response => console.log(response))
  //   .catch(err => console.error(err))
  // const awwSub = subredditTablesMap.get('aww') as SubredditMapModel
  // awwSub
  //   .create({ posts_Default: 'foo' })
  //   .then(result => console.log(result))
  //   .catch(err => console.error(err))
  // db.createUser('Merp')
  //   .then(() => db.createUser('Kermit'))
  //   .then(() => db.createUser('Michael'))
  //   .then(() => db.createUser('Ben'))
  //   .then(() => db.createUser('Karen'))
  //   .then(() => db.createUser('Liz'))
  // db.removeUserSubreddit('Michael', 'abruptchaos').catch(err => console.error(err))
  // db.batchAddSubredditsToMasterList(['aww', 'dogs', 'cats']).catch(err => console.error(err))
  // db.batchAddSubredditsToMasterList(['cats', 'dogs', 'fish', 'rabbits']).then(res => {
  // db.getSinglePostData('asd')
  //   .then(res => {
  //     console.log(res)
  //   })
  //   //   .then(() =>
  //   //     db.getUserSpecificSetting('Kermit', 'subreddits').then(res => {
  //   //       // console.log(res)
  //   //       res.cata({ Just: thing => console.log(thing), Nothing: () => console.log('got nothing') })
  //   //     })
  //   //   )
  //   // eslint-disable-next-line max-lines-per-function
  //   .then(() =>
  //     db.batchAddSubreddits('Ben', ['poop', 'bike', 'cars', 'doors', 'light', 'television', 'speakers'])
  //   )
  //   .then(() => db.getAllSubreddits())
  //   .then(res => {
  //     console.log(res)
  //   })
  //   // .then(() => db.getUserSpecificSetting('Kermit', 'subreddits'))
  //   // .then(res => {
  //   //   // console.log(res)
  //   //   res.cata({ Just: thing => console.log(thing), Nothing: () => console.log('got nothing') })
  //   // })
  // .catch(err => console.error(err))
  // AdminSettings.findByPk(1).then(result => {
  //   console.log(result?.toJSON())
  // })
  // getConnection()
  //   .createQueryRunner()
  //   .hasTable('users')
  //   .then(res => console.log(res))
  // db.getLastScheduledUpdateTime()
  //   .then(res => {
  //     // console.log(res)
  //     res.cata({ Just: thing => console.log(thing), Nothing: () => console.log('got nothing') })
  //     // return db.batchAddSubredditsToMasterList(['derp', 'welp'])
  //   })
  //   .then(() => db.setLastScheduledUpdateTime(new Date()))
  //   .then(res => {
  //     console.log(res)
  //   })
  //   .then(() => db.getLastScheduledUpdateTime())
  //   .then(res => {
  //     // console.log(res)
  //     res.cata({ Just: thing => console.log(thing), Nothing: () => console.log('got nothing') })
  //     // return db.batchAddSubredditsToMasterList(['derp', 'welp'])
  //   })
  // .then(_ => db.getAllSubreddits())
  // .then(res => console.dir(JSON.stringify(res)))
  // .then(res => res.cata({ Just: thing => console.log(thing), Nothing: () => console.log('got nothing') }))
  // )
  // console.log(Object.keys(User))
}, 2000) // eslint-disable-line @typescript-eslint/no-magic-numbers
// setTimeout(() => {
//   db.getLastScheduledUpdateTime()
//     .then(res => {
//       console.log(res)
//       return db.setLastScheduledUpdateTime(new Date())
//     })
//     .then(() =>
//       db.getLastScheduledUpdateTime().then(res => {
//         console.log(res)
//       })
//     )
// }, 3000) // eslint-disable-line @typescript-eslint/no-magic-numbersrs
