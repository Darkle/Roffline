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
  dev: () => dev
});
var import_fs = __toModule(require("fs"));
var import_path = __toModule(require("path"));
var import_prray = __toModule(require("prray"));
var import_node_fetch_commonjs = __toModule(require("node-fetch-commonjs"));
var import_logging = __toModule(require("../logging/logging"));
var import_utils = __toModule(require("../server/utils"));
const dev = {
  createUser(db, user) {
    return db.createUser(user);
  },
  addSubs(db, user, subs) {
    return db.batchAddSubreddits(user, subs);
  },
  addIndividualPosts(db, postsIds) {
    const urls = postsIds.map((postId) => `https://api.reddit.com/api/info/?id=t3_${postId}`);
    return import_prray.default.from(urls).mapAsync((item) => (0, import_node_fetch_commonjs.default)(item).then((resp) => resp.json()), { concurrency: 4 }).then((postsData) => db.batchAddNewPosts(postsData.map((postData) => postData.data.children[0].data)));
  },
  addPosts(db, sub) {
    const urls = [
      `https://www.reddit.com/r/${sub}/.json`,
      `https://www.reddit.com/r/${sub}/top/.json?t=day`,
      `https://www.reddit.com/r/${sub}/top/.json?t=week`,
      `https://www.reddit.com/r/${sub}/top/.json?t=month`,
      `https://www.reddit.com/r/${sub}/top/.json?t=year`,
      `https://www.reddit.com/r/${sub}/top/.json?t=all`
    ];
    return import_prray.default.from(urls).mapAsync((item) => (0, import_node_fetch_commonjs.default)(item).then((resp) => resp.json())).then((subsPostData) => {
      const finalisedSubsPostsData = subsPostData.flatMap((subPostsData) => subPostsData.data.children.map((post) => post.data));
      return finalisedSubsPostsData;
    }).then((finalisedSubsPostsData) => db.batchAddNewPosts(finalisedSubsPostsData));
  },
  addSubPostIdRefs(db, sub) {
    const urls = [
      `https://www.reddit.com/r/${sub}/.json`,
      `https://www.reddit.com/r/${sub}/top/.json?t=day`,
      `https://www.reddit.com/r/${sub}/top/.json?t=week`,
      `https://www.reddit.com/r/${sub}/top/.json?t=month`,
      `https://www.reddit.com/r/${sub}/top/.json?t=year`,
      `https://www.reddit.com/r/${sub}/top/.json?t=all`
    ];
    return import_prray.default.from(urls).mapAsync((item) => (0, import_node_fetch_commonjs.default)(item).then((resp) => resp.json())).then((results) => {
      const thing = {
        [sub]: []
      };
      results.forEach((result, indexOuter) => {
        var _a, _b;
        (_b = (_a = result == null ? void 0 : result.data) == null ? void 0 : _a.children) == null ? void 0 : _b.forEach((post, indexInnner) => {
          let feedCategory = null;
          if (indexOuter === 0) {
            feedCategory = "posts_Default";
          }
          if (indexOuter === 1) {
            feedCategory = "topPosts_Day";
          }
          if (indexOuter === 2) {
            feedCategory = "topPosts_Week";
          }
          if (indexOuter === 3) {
            feedCategory = "topPosts_Month";
          }
          if (indexOuter === 4) {
            feedCategory = "topPosts_Year";
          }
          if (indexOuter === 5) {
            feedCategory = "topPosts_All";
          }
          if (!thing[sub][indexInnner]) {
            thing[sub][indexInnner] = {};
          }
          thing[sub][indexInnner][feedCategory] = post.data.id;
        });
      });
      return thing;
    });
  },
  addComments(db) {
    return db.getAllPostIds().then((postIds) => import_prray.default.from(postIds).mapAsync((postId) => {
      console.log(`https://www.reddit.com/comments/${postId}.json`);
      return (0, import_node_fetch_commonjs.default)(`https://www.reddit.com/comments/${postId}.json`).then((resp) => resp.json()).then((comments) => ({
        comments,
        id: postId
      }));
    }, { concurrency: 4 }).then((comments) => db.batchSaveComments(comments)));
  },
  mockMediaForPosts(db) {
    const postsMediaFolder = (0, import_utils.getEnvFilePath)(process.env["POSTS_MEDIA_DOWNLOAD_DIR"]);
    const getPostMediaDir = (postId) => import_path.default.join(postsMediaFolder, postId);
    return db.getAllPostIds().then((postIds) => import_prray.default.from(postIds).forEachAsync((postId) => {
      const postMediaDir = getPostMediaDir(postId);
      return (0, import_utils.folderExists)(postMediaDir).then((exists) => exists ? Promise.resolve() : import_fs.default.promises.mkdir(getPostMediaDir(postId)));
    }));
  },
  init(db) {
    setTimeout(() => {
      console.log("!!DEV DB FUNCTIONS ARE BEING RUN!!");
      import_logging.dbLogger.warn("!!DEV DB FUNCTIONS ARE BEING RUN!!");
    }, 3e3);
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  dev
});
