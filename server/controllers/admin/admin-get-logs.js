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
  downloadLogs: () => downloadLogs,
  getLogs: () => getLogs
});
var import_fs = __toModule(require("fs"));
var import_path = __toModule(require("path"));
var R = __toModule(require("ramda"));
var import_prray = __toModule(require("prray"));
var import_http_status_codes = __toModule(require("http-status-codes"));
var import_utils = __toModule(require("../../utils"));
const logDir = (0, import_utils.getEnvFilePath)(process.env["LOGDIR"]);
const isLogFile = R.endsWith(".log");
const getPathForFileInLogDir = (fileName) => import_path.default.join(logDir, fileName);
const tryParseJson = R.tryCatch((logLineAsString) => JSON.parse(logLineAsString), R.always({}));
const isNotEmptyObject = R.complement(R.isEmpty);
const convertLogsToJsonForTransport = (logLinesAsStringsArr) => logLinesAsStringsArr.map((logLine) => tryParseJson(logLine)).filter(isNotEmptyObject);
const sortLogsLatestFirst = (logs) => R.reverse(R.sortBy(R.prop("time"), logs));
const joinLogsAndRemoveEmptyLines = (logs) => logs.flatMap((logFile) => logFile.split(/\n/gu)).filter((logLine) => logLine.length > 0);
const getAllLogFileNames = () => import_fs.default.promises.readdir(logDir).then(R.filter(isLogFile));
const readAllLogFiles = () => getAllLogFileNames().then((logFilePaths) => import_prray.default.from(logFilePaths).mapAsync((filePath) => import_fs.default.promises.readFile(getPathForFileInLogDir(filePath), { encoding: "utf8" }).then(R.trim))).then(joinLogsAndRemoveEmptyLines).then(convertLogsToJsonForTransport).then(sortLogsLatestFirst);
async function getLogs(_, reply) {
  const logData = await readAllLogFiles();
  reply.code(import_http_status_codes.StatusCodes.OK).send(logData);
}
const formatLogsForDownload = R.compose(R.join("\n"), R.map(JSON.stringify));
function downloadLogs(_, reply) {
  return readAllLogFiles().then(formatLogsForDownload).then((logDataAsText) => {
    reply.header("Content-disposition", "attachment; filename=rofflinelogs.txt");
    reply.type("txt");
    reply.send(logDataAsText);
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  downloadLogs,
  getLogs
});
