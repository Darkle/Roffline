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
  batchAddNewPosts: () => batchAddNewPosts,
  batchAddSubredditsPostIdReferences: () => batchAddSubredditsPostIdReferences,
  batchClearSubredditTables: () => batchClearSubredditTables,
  batchRemovePosts: () => batchRemovePosts,
  batchSetCommentsDownloadedTrueForPosts: () => batchSetCommentsDownloadedTrueForPosts,
  decrementPostMediaDownloadTry: () => decrementPostMediaDownloadTry,
  findPostsWhichHaveNoSubOwner: () => findPostsWhichHaveNoSubOwner,
  getAllPostIds: () => getAllPostIds,
  getCountOfAllPostsWithMediaStillToDownload: () => getCountOfAllPostsWithMediaStillToDownload,
  getPostIdsWithNoCommentsYetFetched: () => getPostIdsWithNoCommentsYetFetched,
  getPostsWithMediaStillToDownload: () => getPostsWithMediaStillToDownload,
  getSinglePostData: () => getSinglePostData,
  incrementPostMediaDownloadTry: () => incrementPostMediaDownloadTry,
  setMediaDownloadedTrueForPost: () => setMediaDownloadedTrueForPost
});
var R = __toModule(require("ramda"));
var import_timer_node = __toModule(require("timer-node"));
var import_sequelize = __toModule(require("sequelize"));
var import_SubredditTable = __toModule(require("../entities/SubredditTable"));
var import_Posts = __toModule(require("../entities/Posts/Posts"));
var import_logging = __toModule(require("../../logging/logging"));
var import_SubredditsMasterList = __toModule(require("../entities/SubredditsMasterList"));
function getSinglePostData(getPostComments, postId) {
  return Promise.all([
    import_Posts.PostModel.findByPk(postId).then((post) => post == null ? void 0 : post.get()),
    getPostComments(postId)
  ]).then(([postData, commentsData]) => {
    const post = postData;
    post.comments = commentsData;
    return post;
  });
}
function getAllPostIds() {
  return import_Posts.PostModel.findAll({ attributes: ["id"] }).then((items) => items.map((item) => item.get("id")));
}
function getPostIdsWithNoCommentsYetFetched() {
  return import_Posts.PostModel.findAll({ where: { commentsDownloaded: false }, attributes: ["id"] }).then((items) => items.map((item) => item.get("id")));
}
function getPostsWithMediaStillToDownload() {
  return import_Posts.PostModel.findAll({ where: { media_has_been_downloaded: false }, attributes: ["id"] }).then((items) => items.map((item) => item.get()));
}
function getCountOfAllPostsWithMediaStillToDownload() {
  return import_Posts.PostModel.count({ where: { media_has_been_downloaded: false }, attributes: ["id"] });
}
async function batchSetCommentsDownloadedTrueForPosts(sequelize, postIds) {
  await sequelize.transaction((transaction) => import_Posts.PostModel.update({ commentsDownloaded: true }, { where: { id: { [import_sequelize.Op.in]: postIds } }, transaction }));
}
async function setMediaDownloadedTrueForPost(sequelize, postId) {
  await sequelize.transaction((transaction) => import_Posts.PostModel.update({ media_has_been_downloaded: true }, { where: { id: postId }, transaction }));
}
async function incrementPostMediaDownloadTry(sequelize, postId) {
  await sequelize.transaction((transaction) => import_Posts.PostModel.increment("mediaDownloadTries", {
    where: { id: postId, mediaDownloadTries: { [import_sequelize.Op.lt]: 3 } },
    transaction
  }));
}
async function decrementPostMediaDownloadTry(sequelize, postId) {
  await sequelize.transaction((transaction) => import_Posts.PostModel.decrement("mediaDownloadTries", {
    where: { id: postId, mediaDownloadTries: { [import_sequelize.Op.gt]: 0 } },
    transaction
  }));
}
async function batchRemovePosts(sequelize, postsToRemove, transaction = null) {
  const timer = new import_timer_node.Timer();
  timer.start();
  if (transaction) {
    await import_Posts.PostModel.destroy({ where: { id: { [import_sequelize.Op.in]: postsToRemove } }, transaction });
  } else {
    await sequelize.transaction((t) => import_Posts.PostModel.destroy({ where: { id: { [import_sequelize.Op.in]: postsToRemove } }, transaction: t }));
  }
  import_logging.dbLogger.debug(`db.batchRemovePosts for ${postsToRemove.length} posts took ${timer.format("[%s] seconds [%ms] ms")} to complete`);
  timer.clear();
}
async function findPostsWhichHaveNoSubOwner() {
  const allSubs = await import_SubredditsMasterList.SubredditsMasterListModel.findAll({ attributes: ["subreddit"] }).then((subs) => subs.map((subModelItem) => subModelItem.get("subreddit")));
  return import_Posts.PostModel.findAll({ where: { subreddit: { [import_sequelize.Op.notIn]: allSubs } } }).then((subs) => subs.map((postModelItem) => postModelItem.get("id")));
}
async function batchAddNewPosts(sequelize, postsToAdd) {
  if (R.isEmpty(postsToAdd))
    return Promise.resolve();
  const timer = new import_timer_node.Timer();
  timer.start();
  const postsInDB = await sequelize.transaction((transaction) => import_Posts.PostModel.findAll({ attributes: ["id"], transaction }).then((items) => items.map((item) => item.get("id"))));
  const numNewPostsSansExisting = R.differenceWith((x, postId) => x.id === postId, postsToAdd, postsInDB).length;
  await import_Posts.PostModel.bulkCreate(postsToAdd, { ignoreDuplicates: true, validate: true });
  import_logging.dbLogger.debug(`db.batchAddNewPosts for ${numNewPostsSansExisting} posts (${postsToAdd.length} total) took ${timer.format("[%s] seconds [%ms] ms")} to complete`);
  timer.clear();
}
async function batchAddSubredditsPostIdReferences(sequelize, subsPostsIdRefs) {
  await sequelize.transaction((transaction) => Promise.all(Object.keys(subsPostsIdRefs).map((subreddit) => {
    var _a;
    return (_a = import_SubredditTable.subredditTablesMap.get(subreddit.toLowerCase())) == null ? void 0 : _a.bulkCreate(subsPostsIdRefs[subreddit], { ignoreDuplicates: true, transaction });
  })));
}
async function batchClearSubredditTables(sequelize, subs) {
  await sequelize.transaction((transaction) => Promise.all(subs.map((sub) => {
    var _a;
    return (_a = import_SubredditTable.subredditTablesMap.get(sub.toLowerCase())) == null ? void 0 : _a.truncate({ transaction });
  })));
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  batchAddNewPosts,
  batchAddSubredditsPostIdReferences,
  batchClearSubredditTables,
  batchRemovePosts,
  batchSetCommentsDownloadedTrueForPosts,
  decrementPostMediaDownloadTry,
  findPostsWhichHaveNoSubOwner,
  getAllPostIds,
  getCountOfAllPostsWithMediaStillToDownload,
  getPostIdsWithNoCommentsYetFetched,
  getPostsWithMediaStillToDownload,
  getSinglePostData,
  incrementPostMediaDownloadTry,
  setMediaDownloadedTrueForPost
});
