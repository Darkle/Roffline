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
  adminApiRoutes: () => adminApiRoutes
});
var import_http_status_codes = __toModule(require("http-status-codes"));
var import_db = __toModule(require("../../db/db"));
var import_admin_get_logs = __toModule(require("../controllers/admin/admin-get-logs"));
var import_admin_settings = __toModule(require("../controllers/admin/admin-settings"));
var import_admin_stats = __toModule(require("../controllers/admin/admin-stats"));
var import_basic_auth = __toModule(require("../controllers/admin/basic-auth"));
var import_csrf = __toModule(require("../controllers/csrf"));
var import_api_router_schema = __toModule(require("./api-router-schema"));
var import_server_side_events = __toModule(require("../controllers/admin/server-side-events"));
var import_cancel_download = __toModule(require("../controllers/admin/cancel-download"));
const mainPreHandlers = [import_basic_auth.basicAuth];
const adminApiRoutes = (fastify, __, done) => {
  fastify.get("/get-stats", { preHandler: mainPreHandlers }, import_admin_stats.getAdminStats);
  fastify.get("/get-users", { preHandler: mainPreHandlers }, async (_, reply) => {
    const users = await import_db.db.getAllUsersDBDataForAdmin();
    reply.send(users);
  });
  fastify.get("/list-db-tables", { preHandler: mainPreHandlers }, async (_, reply) => {
    const dbTables = await import_db.db.adminListTablesInDB();
    reply.send(dbTables);
  });
  fastify.get("/get-paginated-table-data", { preHandler: mainPreHandlers, schema: import_api_router_schema.adminGetPaginatedTableDataSchema }, async (request, reply) => {
    const { tableName, page, searchTerm } = request.query;
    if (tableName === "comments") {
      const paginatedCommentsTableData = searchTerm ? await import_db.db.adminSearchCommentsDBDataPaginated(searchTerm) : await import_db.db.adminGetCommentsDBDataPaginated(page);
      reply.send(paginatedCommentsTableData);
      return;
    }
    const paginatedTableData = searchTerm ? await import_db.db.adminSearchDBTable(tableName, searchTerm, page) : await import_db.db.adminGetPaginatedTableData(tableName, page);
    reply.send(paginatedTableData);
  });
  fastify.get("/vacuum-db", { preHandler: mainPreHandlers }, async (_, reply) => {
    await import_db.db.adminVacuumDB();
    reply.code(import_http_status_codes.StatusCodes.OK).send();
  });
  fastify.get("/get-logs", { preHandler: mainPreHandlers }, import_admin_get_logs.getLogs);
  fastify.get("/download-logs", { preHandler: mainPreHandlers }, import_admin_get_logs.downloadLogs);
  fastify.put("/update-admin-setting", { preHandler: [...mainPreHandlers, import_csrf.csrfProtection], schema: import_api_router_schema.updateAdminSettingsSchema }, import_admin_settings.updateAdminSetting);
  fastify.put("/cancel-download", { preHandler: [...mainPreHandlers, import_csrf.csrfProtection], schema: import_api_router_schema.adminCancelDownloadSchema }, import_cancel_download.cancelDownload);
  fastify.delete("/delete-user", { preHandler: [...mainPreHandlers, import_csrf.csrfProtection], schema: import_api_router_schema.deleteUserSchema }, async (req, reply) => {
    const { userToDelete } = req.body;
    await import_db.db.deleteUser(userToDelete);
    reply.code(import_http_status_codes.StatusCodes.OK).send();
  });
  fastify.get("/sse-media-downloads-viewer", { preHandler: mainPreHandlers, compress: false }, import_server_side_events.SSEHandler);
  done();
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  adminApiRoutes
});
