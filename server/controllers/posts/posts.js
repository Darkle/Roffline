var __create = Object.create;
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
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
  getPostsPaginated: () => getPostsPaginated,
  getPostsPaginatedForSubreddit: () => getPostsPaginatedForSubreddit,
  infiniteScrollGetMorePosts: () => infiniteScrollGetMorePosts
});
var R = __toModule(require("ramda"));
var import_luxon = __toModule(require("luxon"));
var import_db = __toModule(require("../../../db/db"));
var import_find_posts_media_files = __toModule(require("./find-posts-media-files"));
var import_pretty_date_created_ago = __toModule(require("./pretty-date-created-ago"));
const postsPerPage = 30;
function addPaginationDataToTemplateLocals(reply, { rows: pageWorthOfPosts, count: totalResults }, pageNumber) {
  reply.locals.pageNumber = pageNumber;
  reply.locals.pagination = Math.ceil(totalResults / postsPerPage);
  reply.locals.totalResults = totalResults;
  return pageWorthOfPosts;
}
const addPrettyDatesForEachPost = R.map((post) => __spreadProps(__spreadValues({}, post), {
  prettyDateCreated: import_luxon.DateTime.fromSeconds(post.created_utc, { zone: "Etc/UTC" }).toFormat("yyyy LLL dd, h:mm a"),
  prettyDateCreatedAgo: (0, import_pretty_date_created_ago.genPrettyDateCreatedAgoFromUTC)(post.created_utc)
}));
const saveFinalizedPostsDataToTemplateLocals = R.curry((reply, posts) => {
  reply.locals.posts = posts;
});
async function getPostsPaginated(request, reply) {
  const query = request.query;
  const pageNumber = query.page ? Number(query.page) : 1;
  const { topFilter } = query;
  const user = request.cookies["loggedInUser"];
  const replyWithLocals = reply;
  if (topFilter) {
    replyWithLocals.locals.topFilter = topFilter;
  }
  await import_db.db.getPostsPaginatedForAllSubsOfUser(user, pageNumber, topFilter).then((results) => addPaginationDataToTemplateLocals(replyWithLocals, results, pageNumber)).then(import_find_posts_media_files.findAnyMediaFilesForPosts).then(addPrettyDatesForEachPost).then(saveFinalizedPostsDataToTemplateLocals(replyWithLocals));
}
async function getPostsPaginatedForSubreddit(request, reply) {
  const query = request.query;
  const params = request.params;
  const pageNumber = query.page ? Number(query.page) : 1;
  const { subreddit } = params;
  const { topFilter } = query;
  const replyWithLocals = reply;
  if (topFilter) {
    replyWithLocals.locals.topFilter = topFilter;
  }
  await import_db.db.getPostsPaginatedForSubreddit(subreddit, pageNumber, topFilter).then((results) => addPaginationDataToTemplateLocals(replyWithLocals, results, pageNumber)).then(import_find_posts_media_files.findAnyMediaFilesForPosts).then(addPrettyDatesForEachPost).then(saveFinalizedPostsDataToTemplateLocals(replyWithLocals));
}
const removePaginationDataFromDBResponse = R.prop("rows");
async function infiniteScrollGetMorePosts(request) {
  const query = request.query;
  const params = request.params;
  const pageNumber = query.page ? Number(query.page) : 1;
  const { subreddit } = params;
  const { topFilter } = query;
  const user = request.cookies["loggedInUser"];
  return subreddit ? import_db.db.getPostsPaginatedForSubreddit(subreddit, pageNumber, topFilter).then(removePaginationDataFromDBResponse).then(import_find_posts_media_files.findAnyMediaFilesForPosts).then(addPrettyDatesForEachPost) : import_db.db.getPostsPaginatedForAllSubsOfUser(user, pageNumber, topFilter).then(removePaginationDataFromDBResponse).then(import_find_posts_media_files.findAnyMediaFilesForPosts).then(addPrettyDatesForEachPost);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getPostsPaginated,
  getPostsPaginatedForSubreddit,
  infiniteScrollGetMorePosts
});
