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
  ModeltoPOJO: () => ModeltoPOJO,
  arrayToLowerCase: () => arrayToLowerCase,
  encaseInArrayIfNotArray: () => encaseInArrayIfNotArray,
  ensurePostsMediaDownloadFolderExists: () => ensurePostsMediaDownloadFolderExists,
  folderExists: () => folderExists,
  getEnvFilePath: () => getEnvFilePath,
  getFileSize: () => getFileSize,
  getFolderSize: () => getFolderSize,
  isDev: () => isDev,
  isNonEmptyArray: () => isNonEmptyArray,
  isNotError: () => isNotError,
  noop: () => noop,
  pCreateFolder: () => pCreateFolder,
  pDeleteFolder: () => pDeleteFolder,
  percentage: () => percentage,
  strOrArrayOfStrToLowerCase: () => strOrArrayOfStrToLowerCase
});
var import_path = __toModule(require("path"));
var import_fs = __toModule(require("fs"));
var R = __toModule(require("ramda"));
var import_ramda_adjunct = __toModule(require("ramda-adjunct"));
const isDev = process.env["NODE_ENV"] === "development";
const isAbsolutePath = (pth = "") => pth.startsWith("/");
const getEnvFilePath = (pth = "") => isAbsolutePath(pth) ? pth : import_path.default.join(process.cwd(), pth);
const noop = () => {
};
const strOrArrayOfStrToLowerCase = (thingOrThings) => Array.isArray(thingOrThings) ? thingOrThings.map((thing) => thing.toLowerCase()) : thingOrThings.toLowerCase();
function encaseInArrayIfNotArray(thing) {
  return Array.isArray(thing) ? thing : [thing];
}
function isNonEmptyArray(thing) {
  return Array.isArray(thing) && thing.length > 0;
}
function arrayToLowerCase(arr) {
  return arr.map((thing) => thing.toLowerCase());
}
async function folderExists(folderPath) {
  const exists = await import_fs.default.promises.stat(folderPath).catch(noop);
  return !!exists;
}
async function pDeleteFolder(folderPath) {
  const exists = await folderExists(folderPath);
  return exists ? import_fs.default.promises.rm(folderPath, { recursive: true }) : Promise.resolve();
}
const pCreateFolder = (folder) => import_fs.default.promises.access(folder).catch((_) => import_fs.default.promises.mkdir(folder));
async function ensurePostsMediaDownloadFolderExists() {
  const postsMediaFolder = getEnvFilePath(process.env["POSTS_MEDIA_DOWNLOAD_DIR"]);
  const exists = await folderExists(postsMediaFolder);
  if (!exists) {
    await import_fs.default.promises.mkdir(postsMediaFolder, { recursive: true });
  }
}
const getFileSize = (filePath) => import_fs.default.promises.stat(filePath).then((result) => result.size);
async function getFolderSize(folderPath) {
  const fileSizes = /* @__PURE__ */ new Map();
  async function processItem(itemPath) {
    const stats = await import_fs.default.promises.lstat(itemPath);
    if (typeof stats !== "object")
      return;
    fileSizes.set(stats.ino, stats.size);
    if (stats.isDirectory()) {
      const directoryItems = await import_fs.default.promises.readdir(itemPath);
      if (typeof directoryItems !== "object")
        return;
      await Promise.all(directoryItems.map((directoryItem) => processItem(import_path.default.join(itemPath, directoryItem))));
    }
  }
  await processItem(folderPath);
  const folderSize = Array.from(fileSizes.values()).reduce((total, fileSize) => total + fileSize, 0);
  return folderSize;
}
const ModeltoPOJO = (model) => model == null ? void 0 : model.get();
const percentage = (amount, total) => Math.round(amount / total * 100);
const isNotError = R.complement(import_ramda_adjunct.default.isError);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ModeltoPOJO,
  arrayToLowerCase,
  encaseInArrayIfNotArray,
  ensurePostsMediaDownloadFolderExists,
  folderExists,
  getEnvFilePath,
  getFileSize,
  getFolderSize,
  isDev,
  isNonEmptyArray,
  isNotError,
  noop,
  pCreateFolder,
  pDeleteFolder,
  percentage,
  strOrArrayOfStrToLowerCase
});
