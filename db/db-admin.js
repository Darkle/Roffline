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
  adminGetAnyTableDataPaginated: () => adminGetAnyTableDataPaginated,
  adminGetCommentsDBDataPaginated: () => adminGetCommentsDBDataPaginated,
  adminListTablesInDB: () => adminListTablesInDB,
  adminSearchAnyDBTablePaginated: () => adminSearchAnyDBTablePaginated,
  adminSearchCommentsDBDataPaginated: () => adminSearchCommentsDBDataPaginated,
  adminVacuumDB: () => adminVacuumDB,
  getAdminSettings: () => getAdminSettings,
  getAllUsersDBDataForAdmin: () => getAllUsersDBDataForAdmin,
  getSingleAdminSetting: () => getSingleAdminSetting,
  setAdminData: () => setAdminData
});
var R = __toModule(require("ramda"));
var import_sequelize = __toModule(require("sequelize"));
var import_msgpackr = __toModule(require("msgpackr"));
var import_AdminSettings = __toModule(require("./entities/AdminSettings"));
var import_Users = __toModule(require("./entities/Users/Users"));
function getAdminSettings() {
  return import_AdminSettings.AdminSettingsModel.findByPk(1, {
    attributes: { exclude: ["id"] }
  }).then((item) => item == null ? void 0 : item.get());
}
function getSingleAdminSetting(adminSettingName) {
  return import_AdminSettings.AdminSettingsModel.findByPk(1, { attributes: [adminSettingName] }).then((item) => item == null ? void 0 : item.get(adminSettingName));
}
async function setAdminData(adminSettingName, value) {
  await import_AdminSettings.AdminSettingsModel.update({ [adminSettingName]: value }, { where: { id: 1 } });
}
async function adminListTablesInDB(sequelize) {
  return sequelize.showAllSchemas({ logging: false }).then((tableNames) => [
    ...tableNames,
    { name: "comments" }
  ]);
}
const rowLimit = 50;
function adminGetAnyTableDataPaginated(sequelize, tableName, page = 1) {
  const limit = rowLimit;
  const offset = (page - 1) * limit;
  return Promise.all([
    sequelize.query(`SELECT * FROM :tableName LIMIT :limit ${page > 1 ? "OFFSET :offset" : ""}`, {
      replacements: { tableName, limit, offset },
      raw: true,
      type: import_sequelize.QueryTypes.SELECT
    }),
    sequelize.query("SELECT COUNT(*) as `count` from :tableName", {
      replacements: { tableName },
      raw: true,
      type: import_sequelize.QueryTypes.SELECT
    })
  ]).then(([rows, count]) => ({
    rows,
    count: count[0].count
  }));
}
const unpackComments = R.evolve({ value: import_msgpackr.unpack });
function adminGetCommentsDBDataPaginated(commentsDB, page = 1) {
  const limit = rowLimit;
  const offset = (page - 1) * limit;
  return Promise.resolve({
    rows: Array.from(commentsDB.getRange({ limit, offset })).map(unpackComments),
    count: Array.from(commentsDB.getKeys({ limit: Infinity })).length
  });
}
function adminSearchCommentsDBDataPaginated(commentsDB, searchTerm) {
  const limit = 200;
  const results = Array.from(commentsDB.getRange({ limit }).filter(({ key, value }) => {
    const unpackedComments = JSON.stringify((0, import_msgpackr.unpack)(value));
    return key.includes(searchTerm) || unpackedComments.includes(searchTerm);
  })).map(unpackComments);
  return Promise.resolve({
    rows: results,
    count: results.length
  });
}
async function adminSearchAnyDBTablePaginated(sequelize, tableName, searchTerm, page = 1) {
  const limit = rowLimit;
  const offset = (page - 1) * limit;
  const wrappedSearchTerm = `%${searchTerm}%`;
  const onlyTextColumns = (columns) => columns.filter((item) => {
    var _a;
    return ((_a = item == null ? void 0 : item.type) == null ? void 0 : _a.toLowerCase()) === "text";
  });
  const getColumnName = (columns) => columns.map((column) => column.name);
  const textColumnNamesForTable = await sequelize.query(`PRAGMA table_info(?)`, {
    replacements: [tableName],
    raw: true,
    type: import_sequelize.QueryTypes.SELECT
  }).then(onlyTextColumns).then(getColumnName);
  const tableColumnSearchQueries = textColumnNamesForTable.map((tabName) => `${tabName} LIKE :wrappedSearchTerm`).join(" OR ");
  return Promise.all([
    sequelize.query(`SELECT * FROM :tableName WHERE ${tableColumnSearchQueries} LIMIT :limit ${page > 1 ? "OFFSET :offset" : ""}`, {
      replacements: { tableName, wrappedSearchTerm, limit, offset },
      raw: true,
      type: import_sequelize.QueryTypes.SELECT
    }),
    sequelize.query(`SELECT COUNT(*) as count FROM :tableName WHERE ${tableColumnSearchQueries}`, {
      replacements: { tableName, wrappedSearchTerm },
      raw: true,
      type: import_sequelize.QueryTypes.SELECT
    })
  ]).then(([rows, count]) => ({
    rows,
    count: count[0].count
  }));
}
function getAllUsersDBDataForAdmin() {
  return import_Users.UserModel.findAll().then((users) => users.flatMap((userModel) => userModel.get()));
}
async function adminVacuumDB(sequelize) {
  await sequelize.query(`VACUUM;`, { raw: true });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  adminGetAnyTableDataPaginated,
  adminGetCommentsDBDataPaginated,
  adminListTablesInDB,
  adminSearchAnyDBTablePaginated,
  adminSearchCommentsDBDataPaginated,
  adminVacuumDB,
  getAdminSettings,
  getAllUsersDBDataForAdmin,
  getSingleAdminSetting,
  setAdminData
});
