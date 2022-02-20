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
  addSubreddit: () => addSubreddit,
  bulkImportSubreddits: () => bulkImportSubreddits,
  exportUserSubs: () => exportUserSubs,
  removeSubreddit: () => removeSubreddit
});
var import_http_status_codes = __toModule(require("http-status-codes"));
var R = __toModule(require("ramda"));
var import_db = __toModule(require("../../db/db"));
const subsArrToString = R.join(" ");
const sortSubs = (arr) => arr.sort();
function addSubreddit(req, reply) {
  const user = req.cookies["loggedInUser"];
  const { subToAdd } = req.body;
  return import_db.db.addSubreddit(user, subToAdd).then((_) => reply.code(import_http_status_codes.StatusCodes.OK).send());
}
function removeSubreddit(req, reply) {
  const user = req.cookies["loggedInUser"];
  const { subToRemove } = req.body;
  return import_db.db.removeUserSubreddit(user, subToRemove).then((_) => reply.code(import_http_status_codes.StatusCodes.OK).send());
}
function exportUserSubs(request, reply) {
  const user = request.cookies["loggedInUser"];
  return import_db.db.getUserSubreddits(user).then(sortSubs).then(subsArrToString).then((subsAsString) => {
    reply.header("Content-disposition", "attachment; filename=subs.txt");
    reply.type("txt");
    reply.send(subsAsString);
  });
}
async function bulkImportSubreddits(request, reply) {
  const user = request.cookies["loggedInUser"];
  const { subsToImport } = request.body;
  await import_db.db.batchAddSubreddits(user, subsToImport).then((_) => reply.code(import_http_status_codes.StatusCodes.OK).send());
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  addSubreddit,
  bulkImportSubreddits,
  exportUserSubs,
  removeSubreddit
});
