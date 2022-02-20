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
  searchPosts: () => searchPosts
});
var import_sequelize = __toModule(require("sequelize"));
var import_Users = __toModule(require("../entities/Users/Users"));
const postsPerPage = 30;
function searchPosts({
  userName,
  sequelize,
  searchTerm,
  page,
  fuzzySearch
}) {
  const offset = (page - 1) * postsPerPage;
  const searchTermSQL = fuzzySearch ? `%${searchTerm}%` : `% ${searchTerm} %`;
  const sqlBindings = page > 1 ? [searchTermSQL, postsPerPage, offset] : [searchTermSQL, postsPerPage];
  return sequelize.transaction((transaction) => import_Users.UserModel.findOne({ where: { name: userName }, attributes: ["subreddits"], transaction }).then((user) => user == null ? void 0 : user.get("subreddits")).then((subreddits) => Promise.all([
    sequelize.query(`SELECT title, id, score, subreddit, created_utc, author, permalink FROM posts WHERE subreddit in (?) AND (' ' || title || ' ') LIKE ? LIMIT ? ${page > 1 ? "OFFSET ?" : ""}`, {
      replacements: [subreddits, ...sqlBindings],
      transaction,
      raw: true,
      type: import_sequelize.QueryTypes.SELECT
    }),
    sequelize.query("SELECT COUNT(id) as `count` from posts WHERE subreddit in (?) AND (' ' || title || ' ') LIKE ?", {
      replacements: [subreddits, ...sqlBindings],
      transaction,
      raw: true,
      type: import_sequelize.QueryTypes.SELECT
    })
  ])).then(([rows, count]) => ({
    rows,
    count: count[0].count
  })));
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  searchPosts
});
