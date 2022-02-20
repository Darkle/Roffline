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
  commentsDownloadsLogger: () => commentsDownloadsLogger,
  dbLogger: () => dbLogger,
  fastifyDevlogIgnore: () => fastifyDevlogIgnore,
  feedsLogger: () => feedsLogger,
  mainLogger: () => mainLogger,
  mediaDownloadsLogger: () => mediaDownloadsLogger
});
var import_pino = __toModule(require("pino"));
var import_luxon = __toModule(require("luxon"));
var import_utils = __toModule(require("../server/utils"));
const pinoOptions = {
  name: "roffline",
  level: process.env["LOGGING_LEVEL"],
  base: void 0,
  timestamp() {
    return `,"time":"${import_luxon.DateTime.now().toISO({ includeOffset: true })}"`;
  },
  hooks: {
    logMethod(inputArgs, method) {
      if (typeof inputArgs[0] === "string" && typeof inputArgs[1] === "object") {
        const arg1 = inputArgs.shift();
        const arg2 = inputArgs.shift();
        return method.apply(this, [arg2, arg1, ...inputArgs]);
      }
      return method.apply(this, inputArgs);
    }
  }
};
const transports = import_pino.default.transport({
  targets: [
    {
      level: process.env["LOGGING_LEVEL"],
      target: "pino-pretty",
      options: { destination: 1 }
    },
    {
      level: process.env["LOGGING_LEVEL"],
      target: "./file-logging-transport.cjs",
      options: { outDir: (0, import_utils.getEnvFilePath)(process.env["LOGDIR"]) }
    }
  ]
});
const pathStartersToIgnoreInDev = ["/css/", "/js/", "/static/", "/posts-media/"];
const fastifyDevlogIgnore = {
  ignore(request) {
    return pathStartersToIgnoreInDev.some((pathStarter) => request.url.startsWith(pathStarter));
  }
};
const mainLogger = (0, import_pino.default)(pinoOptions, transports);
const feedsLogger = mainLogger.child({ sublogger: "feeds" });
const commentsDownloadsLogger = mainLogger.child({ sublogger: "comments-downloads" });
const mediaDownloadsLogger = mainLogger.child({ sublogger: "media-downloads" });
const dbLogger = mainLogger.child({ sublogger: "db" });
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  commentsDownloadsLogger,
  dbLogger,
  fastifyDevlogIgnore,
  feedsLogger,
  mainLogger,
  mediaDownloadsLogger
});
