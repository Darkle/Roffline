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
  firstRun: () => firstRun
});
var import_utils = __toModule(require("../server/utils"));
var import_AdminSettings = __toModule(require("./entities/AdminSettings"));
var import_Posts = __toModule(require("./entities/Posts/Posts"));
var import_SubredditsMasterList = __toModule(require("./entities/SubredditsMasterList"));
var import_Users = __toModule(require("./entities/Users/Users"));
const defaultAdminSettings = {
  downloadComments: true,
  numberFeedsOrPostsDownloadsAtOnce: 4,
  numberMediaDownloadsAtOnce: 2,
  downloadVideos: false,
  videoDownloadMaxFileSize: "300",
  videoDownloadResolution: "480p",
  updateAllDay: true,
  updateStartingHour: 1,
  updateEndingHour: 5
};
async function populateTablesOnFirstRun() {
  await import_AdminSettings.AdminSettingsModel.create(defaultAdminSettings);
}
async function createTables(sequelize) {
  await Promise.all([
    (0, import_AdminSettings.initAdminSettingsModel)(sequelize),
    (0, import_Posts.initPostModel)(sequelize),
    (0, import_SubredditsMasterList.initSubredditsMasterListModel)(sequelize),
    (0, import_Users.initUserModel)(sequelize)
  ]);
}
function firstRun(sequelize) {
  return createTables(sequelize).then(() => import_AdminSettings.AdminSettingsModel.findByPk(1).then((result) => result ? (0, import_utils.noop)() : populateTablesOnFirstRun()));
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  firstRun
});
