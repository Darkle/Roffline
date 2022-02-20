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
  createAndSyncSubredditTable: () => createAndSyncSubredditTable,
  createSubredditTable: () => createSubredditTable,
  loadSubredditTableModels: () => loadSubredditTableModels,
  removeSubredditTable: () => removeSubredditTable,
  subredditTablesMap: () => subredditTablesMap
});
var import_sequelize = __toModule(require("sequelize"));
var import_SubredditsMasterList = __toModule(require("./SubredditsMasterList"));
const subredditTablesMap = /* @__PURE__ */ new Map();
const tableSchema = {
  posts_Default: {
    type: import_sequelize.DataTypes.TEXT,
    allowNull: true,
    defaultValue: null
  },
  topPosts_Day: {
    type: import_sequelize.DataTypes.TEXT,
    allowNull: true,
    defaultValue: null
  },
  topPosts_Week: {
    type: import_sequelize.DataTypes.TEXT,
    allowNull: true,
    defaultValue: null
  },
  topPosts_Month: {
    type: import_sequelize.DataTypes.TEXT,
    allowNull: true,
    defaultValue: null
  },
  topPosts_Year: {
    type: import_sequelize.DataTypes.TEXT,
    allowNull: true,
    defaultValue: null
  },
  topPosts_All: {
    type: import_sequelize.DataTypes.TEXT,
    allowNull: true,
    defaultValue: null
  }
};
const genSubTableName = (subreddit) => `subreddit_table_${subreddit.toLowerCase()}`;
function createSubredditTable(subreddit, sequelize) {
  const subTableName = genSubTableName(subreddit);
  return sequelize.define(subTableName, tableSchema, {
    tableName: subTableName,
    timestamps: false
  });
}
async function createAndSyncSubredditTable(subreddit, sequelize, transaction = null) {
  const subLower = subreddit.toLowerCase();
  const subModel = createSubredditTable(subreddit, sequelize);
  await subModel.sync({ transaction }).then(() => subredditTablesMap.set(subLower, subModel));
}
async function loadSubredditTableModels(sequelize) {
  await import_SubredditsMasterList.SubredditsMasterListModel.findAll({ attributes: ["subreddit"] }).then((subreddits) => {
    subreddits.forEach((sub) => {
      const subreddit = sub.get("subreddit");
      const subLower = subreddit.toLowerCase();
      subredditTablesMap.set(subLower, createSubredditTable(subLower, sequelize));
    });
  });
}
async function removeSubredditTable(subredditToRemove) {
  const subModel = subredditTablesMap.get(subredditToRemove);
  await subModel.drop();
  subredditTablesMap.delete(subredditToRemove);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createAndSyncSubredditTable,
  createSubredditTable,
  loadSubredditTableModels,
  removeSubredditTable,
  subredditTablesMap
});
