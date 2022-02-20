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
  findAnyMediaFilesForPosts: () => findAnyMediaFilesForPosts
});
var import_path = __toModule(require("path"));
var import_fs = __toModule(require("fs"));
var RA = __toModule(require("ramda-adjunct"));
var import_prray = __toModule(require("prray"));
var import_utils = __toModule(require("../../utils"));
const postsMediaFolder = (0, import_utils.getEnvFilePath)(process.env["POSTS_MEDIA_DOWNLOAD_DIR"]);
const getPostMediaDir = (postId) => import_path.default.join(postsMediaFolder, postId);
const getListOfPostsDownloadedFiles = (postId) => import_fs.default.promises.readdir(getPostMediaDir(postId));
function findAnyMediaFilesForPosts(posts) {
  return import_prray.default.from(posts).mapAsync(async (post) => {
    const folderExists = await import_fs.default.promises.stat(getPostMediaDir(post.id)).catch(RA.noop);
    return folderExists ? getListOfPostsDownloadedFiles(post.id).then((downloadedFiles) => __spreadProps(__spreadValues({}, post), { downloadedFiles })) : Promise.resolve(__spreadProps(__spreadValues({}, post), { downloadedFiles: [] }));
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  findAnyMediaFilesForPosts
});
