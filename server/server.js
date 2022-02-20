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
  fastify: () => fastify,
  startServer: () => startServer
});
var import_path = __toModule(require("path"));
var import_fastify = __toModule(require("fastify"));
var import_fastify_disablecache = __toModule(require("fastify-disablecache"));
var import_fastify_error_page = __toModule(require("fastify-error-page"));
var import_fastify_favicon = __toModule(require("fastify-favicon"));
var import_fastify_no_additional_properties = __toModule(require("fastify-no-additional-properties"));
var import_fastify_compress = __toModule(require("fastify-compress"));
var import_fastify_static = __toModule(require("fastify-static"));
var import_fastify_url_data = __toModule(require("fastify-url-data"));
var import_point_of_view = __toModule(require("point-of-view"));
var import_fastify_helmet = __toModule(require("fastify-helmet"));
var import_fastify_cookie = __toModule(require("fastify-cookie"));
var import_fastify_formbody = __toModule(require("fastify-formbody"));
var import_nunjucks = __toModule(require("nunjucks"));
var import_fastify_request_logger = __toModule(require("@mgcrea/fastify-request-logger"));
var import_pino_pretty_compact = __toModule(require("@mgcrea/pino-pretty-compact"));
var import_cli_color = __toModule(require("cli-color"));
var import_utils = __toModule(require("./utils"));
var import_logging = __toModule(require("../logging/logging"));
var import_page_router = __toModule(require("./routes/page-router"));
var import_api_router = __toModule(require("./routes/api-router"));
var import_not_found_handler = __toModule(require("./not-found-handler"));
var import_admin_router = __toModule(require("./routes/admin-router"));
var import_error_handler = __toModule(require("./error-handler"));
var import_admin_api_router = __toModule(require("./routes/admin-api-router"));
const postsMediaFolder = (0, import_utils.getEnvFilePath)(process.env["POSTS_MEDIA_DOWNLOAD_DIR"]);
const fastify = (0, import_fastify.default)({
  logger: {
    prettyPrint: import_utils.isDev,
    prettifier: import_pino_pretty_compact.default,
    level: import_utils.isDev ? "info" : "error"
  },
  disableRequestLogging: true,
  ignoreTrailingSlash: true,
  onProtoPoisoning: "remove"
});
import_utils.isDev && fastify.register(import_fastify_request_logger.default, import_logging.fastifyDevlogIgnore);
import_utils.isDev && fastify.register(import_fastify_disablecache.default);
import_utils.isDev && fastify.register(import_fastify_error_page.default);
fastify.register(import_fastify_formbody.default);
fastify.register(import_fastify_favicon.default, { path: "./frontend/static/images", name: "favicon.png" });
fastify.register(import_fastify_no_additional_properties.default);
fastify.register(import_fastify_compress.default);
fastify.register(import_fastify_static.default, {
  root: import_path.default.join(process.cwd(), import_utils.isDev ? "frontend" : "frontend-build")
});
fastify.register(import_fastify_static.default, {
  root: postsMediaFolder,
  prefix: "/posts-media/",
  decorateReply: false
});
fastify.register(import_fastify_cookie.default);
fastify.register(import_fastify_url_data.default);
fastify.register(import_point_of_view.default, {
  engine: { nunjucks: import_nunjucks.default },
  viewExt: "njk",
  root: import_path.default.join(process.cwd(), "server", "views"),
  options: {
    tags: {
      variableStart: "<#",
      variableEnd: "#>"
    }
  }
});
fastify.register(import_fastify_helmet.default, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"]
    }
  }
});
fastify.setSchemaErrorFormatter((errors) => {
  import_logging.mainLogger.error(errors);
  return new Error(errors.toString());
});
fastify.setErrorHandler(import_error_handler.fastifyErrorHandler);
fastify.setNotFoundHandler(import_not_found_handler.notFoundHandler);
fastify.register(import_page_router.pageRoutes);
fastify.register(import_api_router.apiRoutes, { prefix: "/api" });
fastify.register(import_admin_router.adminRoutes, { prefix: "/admin" });
fastify.register(import_admin_api_router.adminApiRoutes, { prefix: "/admin/api" });
const startServer = () => fastify.listen(process.env["PORT"], "0.0.0.0").then(() => {
  console.info(import_cli_color.default.white.bold(`Server Listening On: ${import_cli_color.default.white.underline(`http://0.0.0.0:${process.env["PORT"]}`)}`));
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  fastify,
  startServer
});
