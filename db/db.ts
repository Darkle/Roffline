import * as R from 'ramda'
import { Sequelize, Transaction, Op, QueryTypes } from 'sequelize'
import { match } from 'ts-pattern'
import { Timer } from 'timer-node'
import * as lmdb from 'lmdb'

import { SubredditsMasterListModel } from './entities/SubredditsMasterList'
import { firstRun } from './db-first-run'
import { omitDuplicateSubs } from '../server/utils'
import { dbLogger, mainLogger } from '../logging/logging'
import { UpdatesTrackerModel } from './entities/UpdatesTracker'
import { User, UserModel } from './entities/Users'
import { Post, PostModel } from './entities/Posts'
import {
  createAndSyncSubredditTable,
  loadSubredditTableModels,
  removeSubredditTable,
  SubredditTable,
  TopPostsRowType,
  subredditTablesMap,
} from './entities/SubredditTable'
import {
  getPostsPaginated,
  getPostsPaginatedForSubreddit,
  getTopPostsPaginated,
  getTopPostsPaginatedForSubreddit,
} from './db-get-posts-paginated'
import { searchPosts, SearchLimitedPostType } from './db-search-posts'
import { TableModelTypes } from './entities/entity-types'
import {
  getAdminSettings,
  getSingleAdminSetting,
  setAdminData,
  adminGetAnyTableDataPaginated,
  adminSearchAnyDBTable,
  adminListTablesInDB,
} from './db-admin'
import { StructuredComments } from './entities/Comments'

const sqliteDBPath = process.env['SQLITE_DBPATH'] || './roffline-sqlite.db'
const commentsDBPath = process.env['COMMENTS_DBPATH'] || './roffline-comments-lmdb.db'

type TransactionType = Transaction | null | undefined
type TopFilterType = 'day' | 'week' | 'month' | 'year' | 'all'

type SubsPostsIdDataType = {
  [subreddit: string]: TopPostsRowType[]
}

/*****
  Notes:
    * Until this (https://github.com/sequelize/sequelize/issues/12575) is fixed, we have to map
      over results and use .get() to get raw objects instead of model instances
    * Gotta use getterMethods and setterMethods instead of regular get()/set() in classes because of
        this: https://github.com/sequelize/sequelize/issues/8953
*****/

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: sqliteDBPath,
  logging: (msg): void => mainLogger.trace(msg),
})

const commentsDB = lmdb.open({
  path: commentsDBPath,
  compression: true,
  encoding: 'string',
})

const db = {
  sequelize,
  init(): Promise<void> {
    return firstRun(sequelize).then(() => loadSubredditTableModels(sequelize))
  },
  async close(): Promise<void> {
    await sequelize.close()
    commentsDB.close()
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
      .otherwise(() => UserModel.update({ [settingName]: settingValue }, { where: { name: userName } }))
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
        await this.getUserSubreddits(userName).then((userSubs: User[keyof User]) =>
          removeSubFromUser(userSubs as string[], transaction)
        )

        return this.getAllUsersSubredditsBarOneUser(userName, transaction)
      })
      .then(
        (allUsersSubreddits): Promise<number | void> =>
          noOtherUserHasSubreddit(allUsersSubreddits, subredditToRemove)
            ? removeSubredditTable(subredditToRemove).then(() =>
                SubredditsMasterListModel.destroy({ where: { subreddit: subredditToRemove } })
              )
            : Promise.resolve()
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
    return PostModel.findAll({ attributes: ['id'] }).then(items => items.map(item => item.get('id') as string))
  },
  getPostIdsWithNoCommentsYetFetched(): Promise<string[]> {
    return PostModel.findAll({ where: { commentsDownloaded: false }, attributes: ['id'] }).then(items =>
      items.map(item => item.get('id') as string)
    )
  },
  getPostsWithMediaStillToDownload(): Promise<Post[]> {
    return PostModel.findAll({ where: { media_has_been_downloaded: false }, attributes: ['id'] }).then(items =>
      items.map(item => item.get() as Post)
    )
  },
  getCountOfAllPostsWithMediaStillToDownload(): Promise<number> {
    return PostModel.count({ where: { media_has_been_downloaded: false }, attributes: ['id'] })
  },
  async setMediaDownloadedTrueForPost(postId: string): Promise<void> {
    await PostModel.update({ media_has_been_downloaded: true }, { where: { id: postId } })
  },
  async incrementPostMediaDownloadTry(postId: string): Promise<void> {
    await PostModel.increment('mediaDownloadTries', { where: { id: postId } })
  },
  async batchRemovePosts(postsToRemove: string[]): Promise<void> {
    const timer = new Timer()
    timer.start()

    await PostModel.destroy({ where: { id: { [Op.in]: postsToRemove } } })

    await commentsDB.transactionAsync(() => {
      postsToRemove.forEach(postId => {
        commentsDB.remove(postId)
      })
    })

    dbLogger.debug(
      `db.batchRemovePosts for ${postsToRemove.length} posts and their comments took ${timer.format(
        '[%s] seconds [%ms] ms'
      )} to complete`
    )

    timer.clear()
  },
  // eslint-disable-next-line max-lines-per-function
  async batchAddNewPosts(postsToAdd: Post[]): Promise<void> {
    // eslint-disable-next-line functional/no-conditional-statement
    if (R.isEmpty(postsToAdd)) return Promise.resolve()

    const timer = new Timer()
    timer.start()

    const postsInDB: string[] = await sequelize.transaction(transaction =>
      PostModel.findAll({ attributes: ['id'], transaction }).then(items =>
        items.map(item => item.get('id') as string)
      )
    )

    const numNewPostsSansExisting = R.differenceWith(
      (x: Post, postId: string) => x.id === postId,
      postsToAdd,
      postsInDB
    ).length

    await PostModel.bulkCreate(postsToAdd, { ignoreDuplicates: true, validate: true })

    dbLogger.debug(
      `db.batchAddNewPosts for ${numNewPostsSansExisting} posts (${postsToAdd.length} total) took ${timer.format(
        '[%s] seconds [%ms] ms'
      )} to complete`
    )

    timer.clear()
  },
  // eslint-disable-next-line max-lines-per-function
  async batchSaveComments(postsComments: { id: string; comments: string }[]): Promise<void> {
    const timer = new Timer()
    timer.start()

    const postIds = postsComments.map(({ id }) => id)

    await sequelize.transaction(transaction =>
      PostModel.update({ commentsDownloaded: true }, { transaction, where: { id: { [Op.in]: postIds } } })
    )

    await commentsDB.transactionAsync(() => {
      postsComments.forEach(({ id, comments }) => {
        commentsDB.put(id, comments)
      })
    })

    dbLogger.debug(
      `db.batchAddCommentsToPosts for ${postsComments.length} posts comments took ${timer.format(
        '[%s] seconds [%ms] ms'
      )} to complete`
    )

    timer.clear()
  },
  async batchAddSubredditsPostIdReferences(subsPostsIdRefs: SubsPostsIdDataType): Promise<void> {
    await sequelize.transaction(transaction =>
      Promise.all(
        Object.keys(subsPostsIdRefs).map(subreddit =>
          subredditTablesMap
            .get(subreddit.toLowerCase())
            ?.bulkCreate(subsPostsIdRefs[subreddit] as SubredditTable[], { ignoreDuplicates: true, transaction })
        )
      )
    )
  },
  async batchClearSubredditsPostIdReferences(subs: string[]): Promise<void> {
    await sequelize.transaction(transaction =>
      Promise.all(subs.map(sub => subredditTablesMap.get(sub.toLowerCase())?.truncate({ transaction })))
    )
  },
  getPostComments(postId: string): Promise<StructuredComments> {
    const postCommentsAsString = commentsDB.get(postId) as string
    // Make it promise based. Confusing if one db is promise based and other is sync.
    return Promise.resolve(JSON.parse(postCommentsAsString) as StructuredComments)
  },
  getAdminSettings,
  getSingleAdminSetting,
  setAdminData,
  adminListTablesInDB(): Promise<{ name: string }[]> {
    return adminListTablesInDB(sequelize)
  },
  adminGetPaginatedTableData(tableName: string, page = 1): Promise<{ rows: TableModelTypes[]; count: number }> {
    return adminGetAnyTableDataPaginated(sequelize, tableName, page)
  },
  adminSearchDBTable(
    tableName: string,
    searchTerm: string,
    page = 1
  ): Promise<{ rows: TableModelTypes[]; count: number }> {
    return adminSearchAnyDBTable(sequelize, tableName, searchTerm, page)
  },
  // eslint-disable-next-line max-lines-per-function
  getDBStats(): Promise<{
    subsMasterListTableNumRows: number
    postsTableNumRows: number
    usersTableNumRows: number
    totalDBsizeInBytes: number
  }> {
    return sequelize
      .transaction(transaction =>
        Promise.all([
          SubredditsMasterListModel.count({ transaction }),
          PostModel.count({ transaction }),
          UserModel.count({ transaction }),
          // DB size
          (
            sequelize.query(
              `SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size();`,
              {
                transaction,
                raw: true,
                type: QueryTypes.SELECT,
              }
            ) as Promise<[{ size: number }]>
          ).then((result: [{ size: number }]): number => result[0].size),
        ])
      )
      .then(sizes => ({
        subsMasterListTableNumRows: sizes[0],
        postsTableNumRows: sizes[1],
        usersTableNumRows: sizes[2],
        totalDBsizeInBytes: sizes[3],
      }))
  },
}

export { db }

// eslint-disable-next-line import/order,import/first
import Prray from 'prray'
// eslint-disable-next-line import/order,import/first
import got from 'got'

// eslint-disable-next-line max-lines-per-function
setTimeout(() => {
  // Promise.all([
  //   db.createUser('Merp'),
  //   // db.createUser('Kermit'),
  //   // db.createUser('Kevin'),
  //   // db.createUser('Alex'),
  //   // db.createUser('Miss-Piggy'),
  // ])
  //   .then(() =>
  //     Promise.all([
  //       db.batchAddSubreddits('Merp', ['aww', 'cats', 'dogs', 'bikes', 'cars', 'planes']),
  //       // db.batchAddSubreddits('Kermit', ['dogs', 'bikes', 'cars', 'planes']),
  //       // db.batchAddSubreddits('Kevin', ['cats', 'dogs', 'television']),
  //       // db.batchAddSubreddits('Alex', ['aww', 'cats', 'dogs', 'bikes', 'tables']),
  //       // db.batchAddSubreddits('Miss-Piggy', ['phones', 'chair', 'seats']),
  //     ])
  //   )
  // UserModel.update({ hideStickiedPosts: false }, { where: { name: 'Merp' } })
  // db.setUserSpecificSetting('Merp', 'hideStickiedPosts', true)
  // db.addSubreddit('Merp', 'slevin')
  //// eslint-disable-next-line @typescript-eslint/no-magic-numbers
  // PostModel.findAndCountAll({ limit: 10, offset: 1, order: [['created_utc', 'DESC']] })
  //   .then(thing => thing.rows.map(item => item.get())) // eslint-disable-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-return
  // Prray.from([
  //   '9ko0du',
  //   'phongr',
  //   'phu7xn',
  //   'phzhpn',
  //   'pi9vmq',
  //   'pifwjd',
  //   'pizsk1',
  //   'pjdkp1',
  //   'pjlp5l',
  //   'pkc5fz',
  //   'pkevox',
  //   'pl0cz3',
  //   'pljkd2',
  //   'pmwy9t',
  //   'pn0b0y',
  //   'pn2sj0',
  //   'pnnlx1',
  //   'pntpsl',
  //   'po42ty',
  //   'po494s',
  //   'poszkd',
  //   'pprzl0',
  //   'pq62m6',
  //   'pqmgrx',
  //   'pqr95p',
  //   'pr5mvh',
  //   'prfv8a',
  //   'prrki0',
  //   'ps4c0t',
  //   'psfhv0',
  //   'psixco',
  //   'ptr7wn',
  //   'puqdgj',
  //   'pvezlc',
  //   'pvfzyr',
  //   'pvlr2w',
  //   'pvsogd',
  //   'pwd8f7',
  //   'pwjvog',
  //   'pxerk4',
  //   'pxh8fq',
  //   'pxhunp',
  //   'py4j49',
  //   'pyk4y1',
  //   'pysjdt',
  //   'pz58z0',
  //   'pzfnfq',
  //   'pzh6n9',
  //   'pzk6xp',
  //   'pzst2z',
  //   'pzxhns',
  //   'q066xg',
  //   'q0vcs5',
  //   'q0yzx7',
  //   'q10pud',
  //   'q12zet',
  //   'q137a8',
  //   'q13rnw',
  //   'q146w0',
  //   'q153vf',
  //   'q16z7r',
  //   'q16zfp',
  //   'q17j3d',
  //   'q19vo3',
  //   'q1a37d',
  //   'q1ae9u',
  //   'q1b0ym',
  //   'q1cadb',
  //   'q1cqno',
  //   'q1eibl',
  //   'q1eik6',
  //   'q1h0c7',
  //   'q1iuta',
  //   'q1j5qc',
  //   'q1jfuk',
  //   'q1k2d4',
  //   'q1ksx7',
  // ])
  //   .mapAsync(postId =>
  //     got(`https://www.reddit.com/comments/${postId}.json`).then(resp => ({ comments: resp.body, id: postId }))
  //   )
  //   .then(comments => db.batchSaveComments(comments))
  // .then(db.batchSaveComments)
  // {
  //   aww: [
  //     {posts_Default: string},
  //     {posts_Default: string},
  //     ...
  //     {topPosts_Day: string},
  //     {topPosts_Day: string},
  //     ...
  //   ]
  // }
  // eslint-disable-next-line max-lines-per-function,@typescript-eslint/explicit-function-return-type
  function foo(sub: string, urls: string[]) {
    return (
      Prray.from(urls)
        .mapAsync(item => got(item).json())
        // eslint-disable-next-line max-lines-per-function
        .then(results => {
          const thing = {
            [sub]: [],
          }
          // eslint-disable-next-line max-lines-per-function
          results.forEach((result: any, indexOuter: number) => {
            // eslint-disable-next-line complexity,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,max-lines-per-function
            result?.data?.children?.forEach((post: any, indexInnner: number) => {
              // eslint-disable-next-line functional/no-let
              let feedCategory = null
              // eslint-disable-next-line functional/no-conditional-statement
              if (indexOuter === 0) {
                feedCategory = 'posts_Default'
              }

              // eslint-disable-next-line functional/no-conditional-statement
              if (indexOuter === 1) {
                feedCategory = 'topPosts_Day'
              }

              // eslint-disable-next-line functional/no-conditional-statement
              if (indexOuter === 2) {
                feedCategory = 'topPosts_Week'
              }

              // eslint-disable-next-line functional/no-conditional-statement,@typescript-eslint/no-magic-numbers
              if (indexOuter === 3) {
                feedCategory = 'topPosts_Month'
              }

              // eslint-disable-next-line functional/no-conditional-statement,@typescript-eslint/no-magic-numbers
              if (indexOuter === 4) {
                feedCategory = 'topPosts_Year'
              }

              // eslint-disable-next-line functional/no-conditional-statement,@typescript-eslint/no-magic-numbers
              if (indexOuter === 5) {
                feedCategory = 'topPosts_All'
              }

              /* eslint-disable functional/immutable-data, @typescript-eslint/no-unsafe-member-access, functional/no-conditional-statement */

              // @ts-expect-error assad
              if (!thing[sub][indexInnner]) {
                // @ts-expect-error assad
                thing[sub][indexInnner] = {}
              }

              // @ts-expect-error asdd
              thing[sub][indexInnner][feedCategory] = post.data.id as string
            })
          })
          /* eslint-enable functional/immutable-data, @typescript-eslint/no-unsafe-member-access, functional/no-conditional-statement */
          return thing
        })
    )
  }

  Promise.all([
    foo('cats', [
      'https://www.reddit.com/r/cats/.json',
      'https://www.reddit.com/r/cats/top/.json?t=day',
      'https://www.reddit.com/r/cats/top/.json?t=week',
      'https://www.reddit.com/r/cats/top/.json?t=month',
      'https://www.reddit.com/r/cats/top/.json?t=year',
      'https://www.reddit.com/r/cats/top/.json?t=all',
    ]),
    foo('aww', [
      'https://www.reddit.com/r/aww/.json',
      'https://www.reddit.com/r/aww/top/.json?t=day',
      'https://www.reddit.com/r/aww/top/.json?t=week',
      'https://www.reddit.com/r/aww/top/.json?t=month',
      'https://www.reddit.com/r/aww/top/.json?t=year',
      'https://www.reddit.com/r/aww/top/.json?t=all',
    ]),
  ])
    .then(result => ({ ...result[0], ...result[1] }))
    .then(result => db.batchAddSubredditsPostIdReferences(result))
    // db.batchRemovePosts([
    //   '9ko0du',
    //   'pxh8fq',
    //   'q1cqno',
    //   'q16zfp',
    //   'q1b0ym',
    //   'q153vf',
    //   'q1jfuk',
    //   'q16z7r',
    //   'q1ksx7',
    //   'q1cadb',
    //   'q1eibl',
    //   'q13rnw',
    //   'q1eik6',
    //   'q146w0',
    // ])
    // got('https://www.reddit.com/r/cats/top/.json?t=month')
    // .json()
    //// @ts-expect-error asasd
    // .then(postsData => db.batchAddNewPosts(postsData.data.children.map(item => item.data))) // eslint-disable-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-return
    // .then(postsData => console.log(postsData.data.children)) // eslint-disable-line @typescript-eslint/no-unsafe-member-access
    // .then(result => console.log(result))
    //   .then(() => db.setAdminData('downloadComments', true))
    //   .then(() => db.getAdminSettings())
    // db.removeUserSubreddit('Merp', 'cats')
    // .then(result => {
    //   console.log(result)
    //   // console.log(result.length)
    // })
    // .then(() => db.getAllUsersSubredditsBarOneUser('Miss-Piggy'))
    // //   // db.getLastScheduledUpdateTime()
    // .then(result => console.log(result))
    //   //   .then(() => db.setLastScheduledUpdateTime(new Date()))
    //   .then(() => db.getUserSubreddits('Merp'))
    //   .then(result => console.log(result))
    .then(() => console.log('finished'))
    .catch(err => console.error(err))
}, 2000) // eslint-disable-line @typescript-eslint/no-magic-numbers
