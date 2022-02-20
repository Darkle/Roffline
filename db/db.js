var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __reExport = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, { get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable });
  }
  return target;
};
var __toModule = (module2) => {
  return __reExport(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? { get: () => module2.default, enumerable: true } : { value: module2, enumerable: true })), module2);
};
__export(exports, {
  db: () => db
});
var R = __toModule(require("ramda"));
var import_sequelize = __toModule(require("sequelize"));
var import_timer_node = __toModule(require("timer-node"));
var import_lmdb = __toModule(require("lmdb"));
var import_luxon = __toModule(require("luxon"));
var import_pratica = __toModule(require("pratica"));
var import_msgpackr = __toModule(require("msgpackr"));
var import_SubredditsMasterList = __toModule(require("./entities/SubredditsMasterList"));
var import_db_first_run = __toModule(require("./db-first-run"));
var import_logging = __toModule(require("../logging/logging"));
var import_Users = __toModule(require("./entities/Users/Users"));
var import_Posts = __toModule(require("./entities/Posts/Posts"));
var import_SubredditTable = __toModule(require("./entities/SubredditTable"));
var import_db_get_posts_paginated = __toModule(require("./posts/db-get-posts-paginated"));
var import_db_search_posts = __toModule(require("./posts/db-search-posts"));
var import_db_admin = __toModule(require("./db-admin"));
var import_db_user = __toModule(require("./db-user"));
var import_db_posts = __toModule(require("./posts/db-posts"));
var import_utils = __toModule(require("../server/utils"));
const sqliteDBPath = process.env["SQLITE_DBPATH"] || "./roffline-sqlite.db";
const commentsDBPath = process.env["COMMENTS_DBPATH"] || "./roffline-comments-lmdb.db";
const sequelize = new import_sequelize.Sequelize({
  dialect: "sqlite",
  storage: sqliteDBPath,
  logging: process.env["EXCESSIVE_DB_LOGGING"] ? true : (msg) => import_logging.dbLogger.trace(msg)
});
const commentsDB = import_lmdb.default.open({ path: commentsDBPath, encoding: "binary" });
const db = {
  sequelize,
  init() {
    return (0, import_db_first_run.firstRun)(sequelize).then(() => (0, import_SubredditTable.loadSubredditTableModels)(sequelize));
  },
  async close() {
    await sequelize.close();
    commentsDB.close();
  },
  createUser: import_db_user.createUser,
  deleteUser(userName) {
    return (0, import_db_user.deleteUser)(sequelize, this.batchRemovePosts, this.batchRemoveComments, userName);
  },
  findUser: import_db_user.findUser,
  getUserSettings: import_db_user.getUserSettings,
  getSpecificUserSetting: import_db_user.getSpecificUserSetting,
  getUserSubreddits: import_db_user.getUserSubreddits,
  setUserSpecificSetting: import_db_user.setUserSpecificSetting,
  batchAddUserSubreddits: import_db_user.batchAddUserSubreddits,
  addUserSubreddit: import_db_user.addUserSubreddit,
  getAllUsersSubredditsBarOneUser: import_db_user.getAllUsersSubredditsBarOneUser,
  removeUserSubreddit(userName, subreddit) {
    return (0, import_db_user.removeUserSubreddit)(sequelize, this.batchRemovePosts, this.batchRemoveComments, userName, subreddit);
  },
  getAllSubreddits: import_db_user.getAllSubreddits,
  getAllUsersDBDataForAdmin: import_db_admin.getAllUsersDBDataForAdmin,
  async batchAddSubredditsToMasterList(subreddits, transaction = null) {
    const twoDaysAgoUnixTime = import_luxon.DateTime.now().minus({ days: 2 }).toMillis();
    const subs = subreddits.map((subreddit) => ({
      subreddit,
      lastUpdate: twoDaysAgoUnixTime
    }));
    await import_SubredditsMasterList.SubredditsMasterListModel.bulkCreate(subs, {
      ignoreDuplicates: true,
      transaction
    });
  },
  async addSingleSubredditToMasterList(newSub, transaction = null) {
    const twoDaysAgoUnixTime = import_luxon.DateTime.now().minus({ days: 2 }).toMillis();
    await import_SubredditsMasterList.SubredditsMasterListModel.create({ subreddit: newSub, lastUpdate: twoDaysAgoUnixTime }, { ignoreDuplicates: true, transaction });
  },
  async batchUpdateSubredditsLastUpdatedTime(subreddits) {
    await sequelize.transaction((transaction) => import_SubredditsMasterList.SubredditsMasterListModel.update({ lastUpdate: import_luxon.DateTime.now().toMillis() }, { where: { subreddit: { [import_sequelize.Op.in]: subreddits } }, transaction }));
  },
  async addSubreddit(userName, newSub) {
    await sequelize.transaction((transaction) => Promise.all([
      db.addSingleSubredditToMasterList(newSub, transaction),
      db.addUserSubreddit(userName, newSub, transaction),
      (0, import_SubredditTable.createAndSyncSubredditTable)(newSub, sequelize, transaction)
    ]));
  },
  async batchAddSubreddits(userName, subsToAdd) {
    await sequelize.transaction((transaction) => Promise.all([
      db.batchAddSubredditsToMasterList(subsToAdd, transaction),
      db.batchAddUserSubreddits(userName, subsToAdd, transaction),
      ...subsToAdd.map((sub) => (0, import_SubredditTable.createAndSyncSubredditTable)(sub, sequelize, transaction))
    ]));
  },
  getPostsPaginatedForAllSubsOfUser(userName, page = 1, topFilter = null) {
    return this.getUserSubreddits(userName).then((userSubs) => topFilter ? (0, import_db_get_posts_paginated.getTopPostsPaginatedForAllSubsOfUser)(userSubs, page, topFilter) : (0, import_db_get_posts_paginated.getPostsPaginatedForAllSubsOfUser)(userSubs, page));
  },
  getPostsPaginatedForSubreddit(subreddit, page = 1, topFilter = null) {
    return topFilter ? (0, import_db_get_posts_paginated.getTopPostsPaginatedForSubreddit)(subreddit, page, topFilter) : (0, import_db_get_posts_paginated.getPostsPaginatedForSubreddit)(subreddit, page);
  },
  searchPosts(userName, searchTerm, page = 1, fuzzySearch = false) {
    return (0, import_db_search_posts.searchPosts)({ userName, sequelize, searchTerm, page, fuzzySearch });
  },
  getSinglePostData(postId) {
    return (0, import_db_posts.getSinglePostData)(this.getPostComments, postId);
  },
  findPostsWhichHaveNoSubOwner: import_db_posts.findPostsWhichHaveNoSubOwner,
  getAllPostIds: import_db_posts.getAllPostIds,
  getPostIdsWithNoCommentsYetFetched: import_db_posts.getPostIdsWithNoCommentsYetFetched,
  getPostsWithMediaStillToDownload: import_db_posts.getPostsWithMediaStillToDownload,
  getCountOfAllPostsWithMediaStillToDownload: import_db_posts.getCountOfAllPostsWithMediaStillToDownload,
  setMediaDownloadedTrueForPost(postId) {
    return (0, import_db_posts.setMediaDownloadedTrueForPost)(sequelize, postId);
  },
  batchSetCommentsDownloadedTrueForPosts(postIds) {
    return (0, import_db_posts.batchSetCommentsDownloadedTrueForPosts)(sequelize, postIds);
  },
  incrementPostMediaDownloadTry(postId) {
    return (0, import_db_posts.incrementPostMediaDownloadTry)(sequelize, postId);
  },
  decrementPostMediaDownloadTry(postId) {
    return (0, import_db_posts.decrementPostMediaDownloadTry)(sequelize, postId);
  },
  batchRemovePosts(postsToRemove, transaction = null) {
    return (0, import_db_posts.batchRemovePosts)(sequelize, postsToRemove, transaction);
  },
  batchAddNewPosts(postsToAdd) {
    return (0, import_db_posts.batchAddNewPosts)(sequelize, postsToAdd);
  },
  batchAddSubredditsPostIdReferences(subsPostsIdRefs) {
    return (0, import_db_posts.batchAddSubredditsPostIdReferences)(sequelize, subsPostsIdRefs);
  },
  batchClearSubredditTables(subs) {
    return (0, import_db_posts.batchClearSubredditTables)(sequelize, subs);
  },
  async batchSaveComments(postsComments) {
    const timer = new import_timer_node.Timer();
    timer.start();
    const postIds = postsComments.map(({ id }) => id);
    await sequelize.transaction((transaction) => import_Posts.PostModel.update({ commentsDownloaded: true }, { transaction, where: { id: { [import_sequelize.Op.in]: postIds } } })).then(() => commentsDB.transaction(() => {
      postsComments.forEach(({ id, comments }) => {
        commentsDB.put(id, comments);
      });
    }));
    import_logging.dbLogger.debug(`db.batchAddCommentsToPosts for ${postsComments.length} posts comments took ${timer.format("[%s] seconds [%ms] ms")} to complete`);
    timer.clear();
  },
  async batchRemoveComments(postIdsToRemove) {
    const timer = new import_timer_node.Timer();
    timer.start();
    await commentsDB.transaction(() => {
      postIdsToRemove.forEach((postId) => {
        commentsDB.remove(postId);
      });
    });
    import_logging.dbLogger.debug(`db.batchRemoveComments for ${postIdsToRemove.length} posts comments took ${timer.format("[%s] seconds [%ms] ms")} to complete`);
    timer.clear();
  },
  getPostComments(postId) {
    const postComments = commentsDB.get(postId);
    return Promise.resolve(postComments ? (0, import_pratica.encase)(() => (0, import_msgpackr.unpack)(postComments)).cata({
      Just: R.identity,
      Nothing: () => []
    }) : null);
  },
  getAdminSettings: import_db_admin.getAdminSettings,
  getSingleAdminSetting: import_db_admin.getSingleAdminSetting,
  setAdminData: import_db_admin.setAdminData,
  adminListTablesInDB() {
    return (0, import_db_admin.adminListTablesInDB)(sequelize);
  },
  adminGetPaginatedTableData(tableName, page = 1) {
    return (0, import_db_admin.adminGetAnyTableDataPaginated)(sequelize, tableName, page);
  },
  adminSearchDBTable(tableName, searchTerm, page = 1) {
    return (0, import_db_admin.adminSearchAnyDBTablePaginated)(sequelize, tableName, searchTerm, page);
  },
  adminGetCommentsDBDataPaginated(page) {
    return (0, import_db_admin.adminGetCommentsDBDataPaginated)(commentsDB, page);
  },
  adminSearchCommentsDBDataPaginated(searchTerm) {
    return (0, import_db_admin.adminSearchCommentsDBDataPaginated)(commentsDB, searchTerm);
  },
  adminVacuumDB() {
    return (0, import_db_admin.adminVacuumDB)(sequelize);
  },
  thereAreSubsThatNeedUpdating() {
    const twoHoursAgoUnixTime = import_luxon.DateTime.now().minus({ hours: 2 }).toMillis();
    return import_SubredditsMasterList.SubredditsMasterListModel.findAll({ where: { lastUpdate: { [import_sequelize.Op.lt]: twoHoursAgoUnixTime } } }).then((subs) => subs.length > 0);
  },
  getThingsThatNeedToBeDownloaded() {
    const twoHoursAgoUnixTime = import_luxon.DateTime.now().minus({ hours: 2 }).toMillis();
    const processModels = (models) => models.length > 0 ? models.map((model) => model.get()) : [];
    return Promise.all([
      import_SubredditsMasterList.SubredditsMasterListModel.findAll({ where: { lastUpdate: { [import_sequelize.Op.lt]: twoHoursAgoUnixTime } } }),
      import_Posts.PostModel.findAll({ where: { commentsDownloaded: false }, order: [["created_utc", "DESC"]] }),
      import_Posts.PostModel.findAll({
        where: {
          media_has_been_downloaded: false,
          mediaDownloadTries: { [import_sequelize.Op.lt]: 3 }
        },
        order: [["created_utc", "DESC"]]
      })
    ]).then(([subredditModels, PostModelsWithCommentsToGet, PostModelsWithMediaToDownload]) => [
      processModels(subredditModels),
      processModels(PostModelsWithCommentsToGet),
      processModels(PostModelsWithMediaToDownload)
    ]);
  },
  getDBStats() {
    const commentsDBFilePath = (0, import_utils.getEnvFilePath)(process.env["COMMENTS_DBPATH"]);
    const getSQLiteDBSize = (transaction) => sequelize.query(`SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size();`, {
      transaction,
      raw: true,
      type: import_sequelize.QueryTypes.SELECT
    }).then((result) => result[0].size);
    return sequelize.transaction((transaction) => Promise.all([
      import_SubredditsMasterList.SubredditsMasterListModel.count({ transaction }),
      import_Posts.PostModel.count({ transaction }),
      import_Users.UserModel.count({ transaction }),
      getSQLiteDBSize(transaction),
      (0, import_utils.getFileSize)(commentsDBFilePath)
    ])).then((sizes) => ({
      subsMasterListTableNumRows: sizes[0],
      postsTableNumRows: sizes[1],
      usersTableNumRows: sizes[2],
      totalDBsizeInBytes: sizes[3],
      totalCommentsDBSizeInBytes: sizes[4]
    }));
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  db
});
