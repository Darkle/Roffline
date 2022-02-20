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
  PostModel: () => PostModel,
  initPostModel: () => initPostModel
});
var import_sequelize = __toModule(require("sequelize"));
class PostModel extends import_sequelize.Model {
}
const tableSchema = {
  id: {
    type: import_sequelize.DataTypes.TEXT,
    allowNull: false,
    primaryKey: true
  },
  subreddit: {
    type: import_sequelize.DataTypes.CITEXT,
    allowNull: false,
    validate: { notEmpty: true }
  },
  author: {
    type: import_sequelize.DataTypes.TEXT,
    allowNull: false
  },
  title: {
    type: import_sequelize.DataTypes.TEXT,
    allowNull: false
  },
  selftext: {
    type: import_sequelize.DataTypes.TEXT,
    allowNull: true,
    defaultValue: null
  },
  selftext_html: {
    type: import_sequelize.DataTypes.TEXT,
    allowNull: true,
    defaultValue: null
  },
  score: {
    type: import_sequelize.DataTypes.NUMBER,
    allowNull: false
  },
  is_self: {
    type: import_sequelize.DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  created_utc: {
    type: import_sequelize.DataTypes.NUMBER,
    allowNull: false
  },
  domain: {
    type: import_sequelize.DataTypes.TEXT,
    allowNull: false
  },
  is_video: {
    type: import_sequelize.DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  stickied: {
    type: import_sequelize.DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  media_has_been_downloaded: {
    type: import_sequelize.DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  mediaDownloadTries: {
    type: import_sequelize.DataTypes.NUMBER,
    allowNull: false,
    defaultValue: 0,
    validate: { min: 0, max: 3 }
  },
  post_hint: {
    type: import_sequelize.DataTypes.TEXT,
    allowNull: true,
    defaultValue: null
  },
  permalink: {
    type: import_sequelize.DataTypes.TEXT,
    allowNull: false
  },
  url: {
    type: import_sequelize.DataTypes.TEXT,
    allowNull: false
  },
  media: {
    type: import_sequelize.DataTypes.JSON,
    allowNull: true,
    defaultValue: null
  },
  crosspost_parent: {
    type: import_sequelize.DataTypes.TEXT,
    allowNull: true,
    defaultValue: null
  },
  commentsDownloaded: {
    type: import_sequelize.DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
};
const initPostModel = (sequelize) => {
  PostModel.init(tableSchema, {
    sequelize,
    modelName: "PostModel",
    tableName: "posts",
    timestamps: false
  });
  return PostModel.sync();
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PostModel,
  initPostModel
});
