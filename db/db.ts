import * as R from 'ramda'
import type { Transaction } from 'sequelize'
import { Op, QueryTypes, Sequelize } from 'sequelize'
import { Timer } from 'timer-node'
import lmdb from 'lmdb'
import { DateTime } from 'luxon'
import { nullable as MaybeNullable, encase as Try } from 'pratica'
import { unpack } from 'msgpackr'

import { SubredditsMasterListModel } from './entities/SubredditsMasterList'
import type { SubredditsMasterList } from './entities/SubredditsMasterList'
import { firstRun } from './db-first-run'
import { dbLogger } from '../logging/logging'
import { UserModel } from './entities/Users/Users'
import { PostModel } from './entities/Posts/Posts'
import type { Post, PostWithComments } from './entities/Posts/Post'
import type { TopPostsRowType } from './entities/SubredditTable'
import { createAndSyncSubredditTable, loadSubredditTableModels } from './entities/SubredditTable'
import {
  getPostsPaginatedForAllSubsOfUser,
  getPostsPaginatedForSubreddit,
  getTopPostsPaginatedForAllSubsOfUser,
  getTopPostsPaginatedForSubreddit,
} from './posts/db-get-posts-paginated'
import type { SearchLimitedPostType } from './posts/db-search-posts'
import { searchPosts } from './posts/db-search-posts'
import type { TableModelTypes } from './entities/entity-types'
import {
  getAdminSettings,
  getSingleAdminSetting,
  setAdminData,
  adminGetAnyTableDataPaginated,
  adminSearchAnyDBTablePaginated,
  adminListTablesInDB,
  getAllUsersDBDataForAdmin,
  adminGetCommentsDBDataPaginated,
  adminSearchCommentsDBDataPaginated,
  adminVacuumDB,
} from './db-admin'
import {
  createUser,
  deleteUser,
  findUser,
  getUserSettings,
  getSpecificUserSetting,
  getUserSubreddits,
  setUserSpecificSetting,
  batchAddUserSubreddits,
  addUserSubreddit,
  getAllUsersSubredditsBarOneUser,
  removeUserSubreddit,
  getAllSubreddits,
} from './db-user'
import {
  getSinglePostData,
  getAllPostIds,
  getPostIdsWithNoCommentsYetFetched,
  getPostsWithMediaStillToDownload,
  getCountOfAllPostsWithMediaStillToDownload,
  setMediaDownloadedTrueForPost,
  incrementPostMediaDownloadTry,
  batchRemovePosts,
  batchAddNewPosts,
  batchAddSubredditsPostIdReferences,
  batchClearSubredditTables,
  findPostsWhichHaveNoSubOwner,
  batchSetCommentsDownloadedTrueForPosts,
  decrementPostMediaDownloadTry,
} from './posts/db-posts'

import type { Comments } from './entities/Comments'
import { getEnvFilePath, getFileSize /*isDev*/ } from '../server/utils'

const sqliteDBPath = process.env['TESTING']
  ? 'sqlite::memory:'
  : process.env['SQLITE_DBPATH'] || './roffline-sqlite.db'
const commentsDBPath = process.env['COMMENTS_DBPATH'] || './roffline-comments-lmdb.db'

type TransactionType = Transaction | null | undefined
type TopFilterType = 'day' | 'week' | 'month' | 'year' | 'all'

type SubsPostsIdDataType = {
  [subreddit: string]: TopPostsRowType[]
}

type CommentsDBRow = {
  key: lmdb.Key
  value: Comments
}

type PostIds = string[]

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

/*****
  Setting comments DB to binary because even though lmdb can automatically convert to/from
  messagepack, we want to do the messagepack packing/unpacking manually so can do it
  in small chunks when fetching the comments as opposed to doing the packing all at once
  for all comments when saving all the comments as that would take multiple seconds to
  do it all at once. We do however miss out on using compression if db encoding is set to
  binary.
*****/
const commentsDB = lmdb.open({ path: commentsDBPath, encoding: 'binary' })

const db = {
  sequelize,
  init(): Promise<void> {
    return firstRun(sequelize).then(() => loadSubredditTableModels(sequelize))
  },
  async close(): Promise<void> {
    await sequelize.close()
    commentsDB.close()
  },
  createUser,
  deleteUser(userName: string): Promise<void> {
    return deleteUser(sequelize, this.batchRemovePosts, this.batchRemoveComments, userName)
  },
  findUser,
  getUserSettings,
  getSpecificUserSetting,
  getUserSubreddits,
  setUserSpecificSetting,
  batchAddUserSubreddits,
  addUserSubreddit,
  getAllUsersSubredditsBarOneUser,
  removeUserSubreddit(userName: string, subreddit: string): Promise<void> {
    return removeUserSubreddit(sequelize, this.batchRemovePosts, this.batchRemoveComments, userName, subreddit)
  },
  getAllSubreddits,
  getAllUsersDBDataForAdmin,
  async batchAddSubredditsToMasterList(subreddits: string[], transaction: TransactionType = null): Promise<void> {
    // We set the lastUpdate to two days ago on creation so its feeds will be updated straight away
    const twoDaysAgoUnixTime = DateTime.now().minus({ days: 2 }).toMillis()

    const subs = subreddits.map(subreddit => ({
      subreddit,
      lastUpdate: twoDaysAgoUnixTime,
    }))

    await SubredditsMasterListModel.bulkCreate(subs, {
      ignoreDuplicates: true,
      transaction,
    })
  },
  async addSingleSubredditToMasterList(newSub: string, transaction: TransactionType = null): Promise<void> {
    // We set the lastUpdate to two days ago on creation so its feeds will be updated straight away
    const twoDaysAgoUnixTime = DateTime.now().minus({ days: 2 }).toMillis()

    await SubredditsMasterListModel.create(
      { subreddit: newSub, lastUpdate: twoDaysAgoUnixTime },
      { ignoreDuplicates: true, transaction }
    )
  },
  async batchUpdateSubredditsLastUpdatedTime(subreddits: string[]): Promise<void> {
    await sequelize.transaction(transaction =>
      SubredditsMasterListModel.update(
        { lastUpdate: DateTime.now().toMillis() },
        { where: { subreddit: { [Op.in]: subreddits } }, transaction }
      )
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
  getSinglePostData(postId: string): Promise<PostWithComments> {
    return getSinglePostData(this.getPostComments, postId)
  },
  findPostsWhichHaveNoSubOwner,
  getAllPostIds,
  getPostIdsWithNoCommentsYetFetched,
  getPostsWithMediaStillToDownload,
  getCountOfAllPostsWithMediaStillToDownload,
  setMediaDownloadedTrueForPost(postId: string): Promise<void> {
    return setMediaDownloadedTrueForPost(sequelize, postId)
  },
  batchSetCommentsDownloadedTrueForPosts(postIds: string[]): Promise<void> {
    return batchSetCommentsDownloadedTrueForPosts(sequelize, postIds)
  },
  incrementPostMediaDownloadTry(postId: string): Promise<void> {
    return incrementPostMediaDownloadTry(sequelize, postId)
  },
  decrementPostMediaDownloadTry(postId: string): Promise<void> {
    return decrementPostMediaDownloadTry(sequelize, postId)
  },
  batchRemovePosts(postsToRemove: PostIds, transaction: TransactionType = null): Promise<void> {
    return batchRemovePosts(sequelize, postsToRemove, transaction)
  },
  batchAddNewPosts(postsToAdd: Post[]): Promise<void> {
    return batchAddNewPosts(sequelize, postsToAdd)
  },
  batchAddSubredditsPostIdReferences(subsPostsIdRefs: SubsPostsIdDataType): Promise<void> {
    return batchAddSubredditsPostIdReferences(sequelize, subsPostsIdRefs)
  },
  batchClearSubredditTables(subs: string[]): Promise<void> {
    return batchClearSubredditTables(sequelize, subs)
  },
  // eslint-disable-next-line max-lines-per-function
  async batchSaveComments(postsComments: { id: string; comments: Buffer }[]): Promise<void> {
    const timer = new Timer()
    timer.start()

    const postIds = postsComments.map(({ id }) => id)

    await sequelize
      .transaction(transaction =>
        PostModel.update({ commentsDownloaded: true }, { transaction, where: { id: { [Op.in]: postIds } } })
      )
      .then(() =>
        // Only run this if the previous transaction completed successfully
        commentsDB.transaction(() => {
          postsComments.forEach(({ id, comments }) => {
            commentsDB.put(id, comments)
          })
        })
      )

    dbLogger.debug(
      `db.batchAddCommentsToPosts for ${postsComments.length} posts comments took ${timer.format(
        '[%s] seconds [%ms] ms'
      )} to complete`
    )

    timer.clear()
  },
  async batchRemoveComments(postIdsToRemove: string[]): Promise<void> {
    const timer = new Timer()
    timer.start()

    await commentsDB.transaction(() => {
      postIdsToRemove.forEach(postId => {
        commentsDB.remove(postId)
      })
    })

    dbLogger.debug(
      `db.batchRemoveComments for ${postIdsToRemove.length} posts comments took ${timer.format(
        '[%s] seconds [%ms] ms'
      )} to complete`
    )

    timer.clear()
  },
  getPostComments(postId: string): Promise<Comments | null> {
    // `undefined` result means have not yet fetched any comments for this post.
    const postComments = commentsDB.get(postId) as Buffer | undefined

    // Make it promise based. Confusing if one db is promise based and other is sync.
    return Promise.resolve(
      MaybeNullable(postComments).cata({
        Just: (postCommentsDBData: Buffer): Comments =>
          Try(() => unpack(postCommentsDBData) as Comments).cata({
            Just: R.identity,
            Nothing: () => [],
          }),
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
    return adminSearchAnyDBTablePaginated(sequelize, tableName, searchTerm, page)
  },
  adminGetCommentsDBDataPaginated(page: number | undefined): Promise<{
    rows: CommentsDBRow[]
    count: number
  }> {
    return adminGetCommentsDBDataPaginated(commentsDB, page)
  },
  adminSearchCommentsDBDataPaginated(searchTerm: string): Promise<{
    rows: CommentsDBRow[]
    count: number
  }> {
    return adminSearchCommentsDBDataPaginated(commentsDB, searchTerm)
  },
  adminVacuumDB(): Promise<void> {
    return adminVacuumDB(sequelize)
  },
  thereAreSubsThatNeedUpdating(): Promise<boolean> {
    const twoHoursAgoUnixTime = DateTime.now().minus({ hours: 2 }).toMillis()

    return SubredditsMasterListModel.findAll({ where: { lastUpdate: { [Op.lt]: twoHoursAgoUnixTime } } }).then(
      subs => subs.length > 0
    )
  },
  // eslint-disable-next-line max-lines-per-function
  getThingsThatNeedToBeDownloaded(): Promise<[SubredditsMasterList[], Post[], Post[]]> {
    const twoHoursAgoUnixTime = DateTime.now().minus({ hours: 2 }).toMillis()

    type Models = SubredditsMasterListModel[] | PostModel[]

    const processModels = (models: Models): (SubredditsMasterList | Post)[] =>
      models.length > 0 ? models.map(model => model.get() as SubredditsMasterList | Post) : []

    /*****
      We order comments and media by `created_utc` as it would be preferable to download the most
      recent posts first as they will be the ones on the front page.
    *****/

    return Promise.all([
      SubredditsMasterListModel.findAll({ where: { lastUpdate: { [Op.lt]: twoHoursAgoUnixTime } } }),
      PostModel.findAll({ where: { commentsDownloaded: false }, order: [['created_utc', 'DESC']] }),
      PostModel.findAll({
        where: {
          media_has_been_downloaded: false,
          // eslint-disable-next-line @typescript-eslint/no-magic-numbers
          mediaDownloadTries: { [Op.lt]: 3 },
        },
        order: [['created_utc', 'DESC']],
      }),
    ]).then(([subredditModels, PostModelsWithCommentsToGet, PostModelsWithMediaToDownload]) => [
      processModels(subredditModels) as SubredditsMasterList[],
      processModels(PostModelsWithCommentsToGet) as Post[],
      processModels(PostModelsWithMediaToDownload) as Post[],
    ])
  },
  // eslint-disable-next-line max-lines-per-function
  getDBStats(): Promise<{
    subsMasterListTableNumRows: number
    postsTableNumRows: number
    usersTableNumRows: number
    totalDBsizeInBytes: number
    totalCommentsDBSizeInBytes: number
  }> {
    const commentsDBFilePath = getEnvFilePath(process.env['COMMENTS_DBPATH'])

    const getSQLiteDBSize = (transaction: Transaction): Promise<number> =>
      (
        sequelize.query(`SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size();`, {
          transaction,
          raw: true,
          type: QueryTypes.SELECT,
        }) as Promise<[{ size: number }]>
      ).then((result: [{ size: number }]): number => result[0].size)

    return sequelize
      .transaction(transaction =>
        Promise.all([
          SubredditsMasterListModel.count({ transaction }),
          PostModel.count({ transaction }),
          UserModel.count({ transaction }),
          getSQLiteDBSize(transaction),
          getFileSize(commentsDBFilePath),
        ])
      )
      .then(sizes => ({
        subsMasterListTableNumRows: sizes[0],
        postsTableNumRows: sizes[1],
        usersTableNumRows: sizes[2],
        totalDBsizeInBytes: sizes[3],
        totalCommentsDBSizeInBytes: sizes[4],
      }))
  },
}

// // eslint-disable-next-line import/first
// import { dev } from './db-dev'
// isDev && dev.init(db)

export { db, CommentsDBRow }
