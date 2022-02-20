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
  getPostsPaginatedForAllSubsOfUser: () => getPostsPaginatedForAllSubsOfUser,
  getPostsPaginatedForSubreddit: () => getPostsPaginatedForSubreddit,
  getTopPostsPaginatedForAllSubsOfUser: () => getTopPostsPaginatedForAllSubsOfUser,
  getTopPostsPaginatedForSubreddit: () => getTopPostsPaginatedForSubreddit
});
var import_sequelize = __toModule(require("sequelize"));
var import_luxon = __toModule(require("luxon"));
var import_Posts = __toModule(require("../entities/Posts/Posts"));
const postsPerPage = 30;
const formatFindAllAndCountResponse = (resp) => ({
  count: resp.count,
  rows: resp.rows.map((item) => item.get())
});
function getPostsPaginatedForAllSubsOfUser(userSubs, page) {
  const offset = (page - 1) * postsPerPage;
  return import_Posts.PostModel.findAndCountAll({
    offset,
    limit: postsPerPage,
    order: [["created_utc", "DESC"]],
    where: {
      subreddit: {
        [import_sequelize.Op.in]: userSubs
      }
    }
  }).then(formatFindAllAndCountResponse);
}
const getFilteredTimeAsUnixTimestamp = (topFilter) => Math.round(import_luxon.DateTime.now().minus({ [topFilter]: 1 }).toSeconds());
function getTopPostsPaginatedForAllSubsOfUser(userSubs, page, topFilter) {
  const offset = (page - 1) * postsPerPage;
  const filterTime = topFilter === "all" ? 0 : getFilteredTimeAsUnixTimestamp(topFilter);
  return import_Posts.PostModel.findAndCountAll({
    where: {
      created_utc: {
        [import_sequelize.Op.gt]: filterTime
      },
      subreddit: {
        [import_sequelize.Op.in]: userSubs
      }
    },
    offset,
    limit: postsPerPage,
    order: [["score", "DESC"]]
  }).then(formatFindAllAndCountResponse);
}
function getPostsPaginatedForSubreddit(subreddit, page) {
  const offset = (page - 1) * postsPerPage;
  return import_Posts.PostModel.findAndCountAll({
    where: { subreddit },
    offset,
    limit: postsPerPage,
    order: [["created_utc", "DESC"]]
  }).then(formatFindAllAndCountResponse);
}
function getTopPostsPaginatedForSubreddit(subreddit, page, topFilter) {
  const offset = (page - 1) * postsPerPage;
  const filterTime = topFilter === "all" ? 0 : getFilteredTimeAsUnixTimestamp(topFilter);
  return import_Posts.PostModel.findAndCountAll({
    where: {
      subreddit,
      created_utc: {
        [import_sequelize.Op.gt]: filterTime
      }
    },
    offset,
    limit: postsPerPage,
    order: [["score", "DESC"]]
  }).then(formatFindAllAndCountResponse);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getPostsPaginatedForAllSubsOfUser,
  getPostsPaginatedForSubreddit,
  getTopPostsPaginatedForAllSubsOfUser,
  getTopPostsPaginatedForSubreddit
});
