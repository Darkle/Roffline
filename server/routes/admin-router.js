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
  adminRoutes: () => adminRoutes
});
var import_querystring = __toModule(require("querystring"));
var import_basic_auth = __toModule(require("../controllers/admin/basic-auth"));
var import_csrf = __toModule(require("../controllers/csrf"));
var import_admin_settings = __toModule(require("../controllers/admin/admin-settings"));
var import_default_template_props = __toModule(require("../controllers/default-template-props"));
const mainPreHandlers = [import_basic_auth.basicAuth, import_default_template_props.setDefaultTemplateProps];
const adminRoutes = (fastify, __, done) => {
  fastify.get("/", { preHandler: mainPreHandlers }, (_, reply) => {
    reply.view("admin/admin-stats-page", {
      pageTitle: "Roffline::Admin::Stats"
    });
  });
  fastify.get("/settings", { preHandler: [...mainPreHandlers, import_admin_settings.getAdminSettingsForAnAdminPage] }, (_, reply) => {
    reply.view("admin/admin-settings-page", {
      pageTitle: "Roffline::Admin::Settings",
      csrfToken: (0, import_csrf.createCsrfToken)(),
      unescapeHTML: import_querystring.default.unescape
    });
  });
  fastify.get("/users", { preHandler: mainPreHandlers }, (_, reply) => {
    reply.view("admin/admin-users-page", {
      pageTitle: "Roffline::Admin::Users",
      csrfToken: (0, import_csrf.createCsrfToken)(),
      unescapeHTML: import_querystring.default.unescape
    });
  });
  fastify.get("/db-viewer", { preHandler: mainPreHandlers }, (_, reply) => {
    reply.view("admin/admin-db-viewer-page", {
      pageTitle: "Roffline::Admin::DB-Viewer",
      csrfToken: (0, import_csrf.createCsrfToken)(),
      unescapeHTML: import_querystring.default.unescape
    });
  });
  fastify.get("/logs-viewer", { preHandler: mainPreHandlers }, (_, reply) => {
    reply.view("admin/admin-logs-viewer-page", {
      pageTitle: "Roffline::Admin::Logs-Viewer",
      csrfToken: (0, import_csrf.createCsrfToken)(),
      unescapeHTML: import_querystring.default.unescape
    });
  });
  fastify.get("/downloads-viewer", { preHandler: mainPreHandlers }, (_, reply) => {
    reply.view("admin/admin-downloads-viewer.njk", {
      pageTitle: "Roffline::Downloads Viewer",
      csrfToken: (0, import_csrf.createCsrfToken)(),
      unescapeHTML: import_querystring.default.unescape
    });
  });
  done();
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  adminRoutes
});
