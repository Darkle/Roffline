var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
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
var import_dns_cache = __toModule(require("dns-cache"));
var R = __toModule(require("ramda"));
var import_ramda_adjunct = __toModule(require("ramda-adjunct"));
var import_server = __toModule(require("./server/server"));
var import_logging = __toModule(require("./logging/logging"));
var import_db = __toModule(require("./db/db"));
var import_utils = __toModule(require("./server/utils"));
var import_update_scheduler = __toModule(require("./downloads/update-scheduler"));
function bailOnFatalError(err) {
  console.error(err);
  R.tryCatch(import_logging.mainLogger.fatal, import_ramda_adjunct.default.noop)(err);
  import_db.db.close().catch(import_ramda_adjunct.default.noop).finally(() => {
    setImmediate((_) => process.exit(1));
  });
}
process.on("unhandledRejection", bailOnFatalError);
process.on("uncaughtException", bailOnFatalError);
const thirtyMinutesInMs = 18e5;
(0, import_dns_cache.default)(thirtyMinutesInMs);
import_db.db.init().then(import_utils.ensurePostsMediaDownloadFolderExists).then(import_server.startServer).then(import_update_scheduler.scheduleUpdates).catch((err) => {
  console.error(err);
  import_logging.mainLogger.fatal(err);
  process.exit(1);
});
