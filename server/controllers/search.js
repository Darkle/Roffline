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
  searchPosts: () => searchPosts
});
var import_luxon = __toModule(require("luxon"));
var import_db = __toModule(require("../../db/db"));
var import_pretty_date_created_ago = __toModule(require("./posts/pretty-date-created-ago"));
function addPrettyDatesForEachResult(results) {
  results.rows = results.rows.map((post) => __spreadProps(__spreadValues({}, post), {
    prettyDateCreated: import_luxon.DateTime.fromSeconds(post.created_utc, { zone: "Etc/UTC" }).toFormat("yyyy LLL dd, h:mm a"),
    prettyDateCreatedAgo: (0, import_pretty_date_created_ago.genPrettyDateCreatedAgoFromUTC)(post.created_utc)
  }));
  return results;
}
const resultsPerPage = 30;
const addResultsDataToTemplateLocals = (replyWithLocals, pageNumber, { rows: pageWorthOfPosts, count }) => {
  replyWithLocals.locals.searchResults = pageWorthOfPosts;
  replyWithLocals.locals.pageNumber = pageNumber;
  replyWithLocals.locals.totalResults = count;
  replyWithLocals.locals.pagination = Math.ceil(count / resultsPerPage);
};
async function searchPosts(request, reply) {
  const replyWithLocals = reply;
  const query = request.query;
  const pageNumber = query.page ? Number(query.page) : 1;
  const { searchTerm } = query;
  const { fuzzySearch } = query;
  const user = request.cookies["loggedInUser"];
  if (!searchTerm)
    return;
  if (fuzzySearch)
    replyWithLocals.locals.fuzzySearch = true;
  replyWithLocals.locals.searchTerm = searchTerm;
  await import_db.db.searchPosts(user, searchTerm, pageNumber, fuzzySearch).then(addPrettyDatesForEachResult).then((results) => addResultsDataToTemplateLocals(replyWithLocals, pageNumber, results));
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  searchPosts
});
