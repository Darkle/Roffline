import * as R from 'ramda'
import { Sequelize, Transaction, Op, QueryTypes } from 'sequelize'
import { match } from 'ts-pattern'
import { Timer } from 'timer-node'
import * as lmdb from 'lmdb'
import { nullable as MaybeNullable, Maybe } from 'pratica'

import { SubredditsMasterListModel } from './entities/SubredditsMasterList'
import { firstRun } from './db-first-run'
import { dbLogger } from '../logging/logging'
import { UpdatesTrackerModel } from './entities/UpdatesTracker'
import { User } from './entities/Users/User'
import { UserModel } from './entities/Users/Users'
import { PostModel } from './entities/Posts/Posts'
import { Post, PostWithComments } from './entities/Posts/Post'
import {
  createAndSyncSubredditTable,
  loadSubredditTableModels,
  removeSubredditTable,
  SubredditTable,
  TopPostsRowType,
  subredditTablesMap,
} from './entities/SubredditTable'
import {
  getPostsPaginatedForAllSubsOfUser,
  getPostsPaginatedForSubreddit,
  getTopPostsPaginatedForAllSubsOfUser,
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
import { CommentContainer } from './entities/Comments'
import { noop } from '../server/utils'

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
  logging: (msg): void => dbLogger.trace(msg),
  // logging: true,
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
  findUser(userName: string): Promise<Maybe<User>> {
    return this.getUserSettings(userName).then(MaybeNullable)
  },
  getUserSettings(userName: string): Promise<User> {
    return UserModel.findOne({ where: { name: userName } }).then(userAsModel => userAsModel?.get() as User)
  },
  getUserSpecificSetting(userName: string, settingName: keyof User): Promise<User[keyof User]> {
    return UserModel.findOne({ where: { name: userName }, attributes: [settingName] }).then(
      user => user?.get(settingName) as User[keyof User]
    )
  },
  getUserSubreddits(userName: string): Promise<string[]> {
    return this.getUserSpecificSetting(userName, 'subreddits') as Promise<string[]>
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

    const omitDuplicateSubs = (currentSubs: string[], newSubs: string[]): string[] => {
      const currentSubsLowercase = currentSubs.length ? currentSubs.map((sub: string) => sub.toLowerCase()) : []
      // Lowercase new subs in case they misstype and add a duplicate - e.g. Cats and then CAts
      const newSubsLowercase = newSubs.map((sub: string) => sub.toLowerCase())

      return R.uniq([...currentSubsLowercase, ...newSubsLowercase])
    }

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
        (allUsersSubreddits): Promise<void> =>
          noOtherUserHasSubreddit(allUsersSubreddits, subredditToRemove)
            ? Promise.all([
                removeSubredditTable(subredditToRemove),
                SubredditsMasterListModel.destroy({ where: { subreddit: subredditToRemove } }),
              ]).then(noop)
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
  getSinglePostData(postId: string): Promise<PostWithComments> {
    return Promise.all([
      PostModel.findByPk(postId).then(post => post?.get() as Post),
      this.getPostComments(postId),
    ]).then(([postData, commentsData]) => {
      const post = postData as PostWithComments
      post.comments = commentsData
      return post
    })
  },
  getPostsPaginatedForAllSubsOfUser(
    userName: string,
    page = 1,
    topFilter: null | TopFilterType = null
  ): Promise<{ count: number; rows: Post[] }> {
    return this.getUserSubreddits(userName).then(userSubs =>
      topFilter
        ? getTopPostsPaginatedForAllSubsOfUser(userSubs, page, topFilter)
        : getPostsPaginatedForAllSubsOfUser(userSubs, page)
    )
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
    userName: string,
    searchTerm: string,
    page = 1,
    fuzzySearch = false
  ): Promise<{ rows: SearchLimitedPostType[]; count: number }> {
    return searchPosts({ userName, sequelize, searchTerm, page, fuzzySearch })
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
  getPostComments(postId: string): Promise<CommentContainer[] | [] | null> {
    const maybePostCommentsAsString = MaybeNullable(commentsDB.get(postId))

    const uJSONParse = R.unary(JSON.parse)

    const tryParseJson = R.tryCatch(uJSONParse, R.always({}))

    // There's a alot of metadata cruft we need to skip to get to the comments data
    const getCommentsData = R.compose(R.pathOr([], [1, 'data', 'children']), tryParseJson)

    // Make it promise based. Confusing if one db is promise based and other is sync.
    return Promise.resolve(
      maybePostCommentsAsString.cata({
        Just: getCommentsData,
        Nothing: () => null,
      })
    )
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

// // eslint-disable-next-line import/first
// import { dev } from './db-dev'
// // eslint-disable-next-line import/first
//import { isDev } from '../server/utils'
// isDev && dev.init(db)

export { db }
