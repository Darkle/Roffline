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
  AdminSettingsModel: () => AdminSettingsModel,
  initAdminSettingsModel: () => initAdminSettingsModel
});
var import_sequelize = __toModule(require("sequelize"));
class AdminSettingsModel extends import_sequelize.Model {
}
const tableSchema = {
  downloadComments: {
    type: import_sequelize.DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  numberFeedsOrPostsDownloadsAtOnce: {
    type: import_sequelize.DataTypes.NUMBER,
    allowNull: false,
    defaultValue: 4,
    validate: { min: 1 }
  },
  numberMediaDownloadsAtOnce: {
    type: import_sequelize.DataTypes.NUMBER,
    allowNull: false,
    defaultValue: 2,
    validate: { min: 1 }
  },
  downloadVideos: {
    type: import_sequelize.DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  videoDownloadMaxFileSize: {
    type: import_sequelize.DataTypes.TEXT,
    allowNull: false,
    defaultValue: "300",
    validate: { notEmpty: true }
  },
  videoDownloadResolution: {
    type: import_sequelize.DataTypes.TEXT,
    allowNull: false,
    defaultValue: "480p",
    validate: { isIn: [["240p", "360p", "480p", "720p", "1080p", "1440p", "2160p"]] }
  },
  updateAllDay: {
    type: import_sequelize.DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  updateStartingHour: {
    type: import_sequelize.DataTypes.NUMBER,
    allowNull: false,
    defaultValue: 1,
    validate: { min: 0, max: 23 }
  },
  updateEndingHour: {
    type: import_sequelize.DataTypes.NUMBER,
    allowNull: false,
    defaultValue: 5,
    validate: { min: 0, max: 23 }
  }
};
const initAdminSettingsModel = (sequelize) => {
  AdminSettingsModel.init(tableSchema, {
    sequelize,
    modelName: "AdminSettingsModel",
    tableName: "admin_settings",
    timestamps: false,
    defaultScope: {
      where: {
        id: 1
      }
    }
  });
  return AdminSettingsModel.sync();
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AdminSettingsModel,
  initAdminSettingsModel
});
