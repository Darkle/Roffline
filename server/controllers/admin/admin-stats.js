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
  getAdminStats: () => getAdminStats
});
var import_pretty_bytes = __toModule(require("pretty-bytes"));
var import_prettify_time = __toModule(require("prettify-time"));
var import_cpu_stat = __toModule(require("cpu-stat"));
var R = __toModule(require("ramda"));
var import_db = __toModule(require("../../../db/db"));
var import_utils = __toModule(require("../../utils"));
const getCpuUsagePercentP = () => new Promise((resolve, reject) => {
  import_cpu_stat.default.usagePercent((err, percent) => err ? reject(err) : resolve(percent));
});
const postsMediaFolder = (0, import_utils.getEnvFilePath)(process.env["POSTS_MEDIA_DOWNLOAD_DIR"]);
const oneSecond = 60;
const readableUptime = (seconds) => seconds < oneSecond ? `${Math.round(seconds)}s` : (0, import_prettify_time.default)(seconds);
const formatStats = R.evolve({
  rss: import_pretty_bytes.default,
  uptime: readableUptime,
  cpuUsage: Math.round,
  postsMediaFolderSize: import_pretty_bytes.default,
  dbSize: import_pretty_bytes.default,
  commentsDBSize: import_pretty_bytes.default
});
const processResults = (results) => {
  const [
    cpuUsage,
    {
      subsMasterListTableNumRows: numSubs,
      postsTableNumRows: numPosts,
      usersTableNumRows: numUsers,
      totalDBsizeInBytes: dbSize,
      totalCommentsDBSizeInBytes: commentsDBSize
    },
    postsWithMediaStillToDownload,
    postsMediaFolderSize,
    rss,
    uptime
  ] = results;
  return __spreadProps(__spreadValues({}, formatStats({
    cpuUsage,
    rss,
    dbSize,
    commentsDBSize,
    postsWithMediaStillToDownload,
    postsMediaFolderSize,
    uptime
  })), {
    numSubs,
    numPosts,
    numUsers
  });
};
async function getAdminStats(_, reply) {
  const stats = await Promise.all([
    getCpuUsagePercentP(),
    import_db.db.getDBStats(),
    import_db.db.getCountOfAllPostsWithMediaStillToDownload(),
    (0, import_utils.getFolderSize)(postsMediaFolder),
    Promise.resolve(process.memoryUsage().rss),
    Promise.resolve(process.uptime())
  ]).then(processResults);
  reply.send(stats);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getAdminStats
});
