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
  notFoundHandler: () => notFoundHandler
});
var import_http_status_codes = __toModule(require("http-status-codes"));
var import_logging = __toModule(require("../logging/logging"));
const isAnApiRoute = (url) => url.startsWith("/admin/api/") || url.startsWith("/api/");
const isAnAdminPage = (url) => url.startsWith("/admin/");
function notFoundHandler(req, reply) {
  import_logging.mainLogger.error(`404, page not found: ${req.url}`);
  if (isAnApiRoute(req.url)) {
    reply.code(import_http_status_codes.StatusCodes.NOT_FOUND).send();
    return;
  }
  if (isAnAdminPage(req.url)) {
    reply.code(import_http_status_codes.StatusCodes.NOT_FOUND).send(`404 - page not found`);
    return;
  }
  reply.code(import_http_status_codes.StatusCodes.NOT_FOUND).view("404-page", { pageTitle: "Page Not Found" });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  notFoundHandler
});
