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
  apiRoutes: () => apiRoutes
});
var import_csrf = __toModule(require("../controllers/csrf"));
var import_posts = __toModule(require("../controllers/posts/posts"));
var import_subs = __toModule(require("../controllers/subs"));
var import_user = __toModule(require("../controllers/user"));
var import_api_router_schema = __toModule(require("./api-router-schema"));
const mainPreHandlers = [import_user.checkUserLoggedIn];
const apiRoutes = (fastify, _, done) => {
  fastify.get("/infinite-scroll-load-more-posts", { preHandler: mainPreHandlers }, async (request, reply) => {
    const posts = await (0, import_posts.infiniteScrollGetMorePosts)(request);
    reply.send(posts);
  });
  fastify.get("/export-user-subs", { preHandler: mainPreHandlers }, import_subs.exportUserSubs);
  fastify.post("/login-user", {
    preHandler: import_csrf.csrfProtection,
    handler: import_user.logUserIn,
    schema: import_api_router_schema.logUserInSchema
  });
  fastify.post("/create-user", {
    preHandler: import_csrf.csrfProtection,
    handler: import_user.createUser,
    schema: import_api_router_schema.createUserInSchema
  });
  fastify.put("/update-user-setting", {
    preHandler: [...mainPreHandlers, import_csrf.csrfProtection],
    handler: import_user.updateUserSetting,
    schema: import_api_router_schema.updateUserSettingsSchema
  });
  fastify.post("/add-user-subreddit", {
    preHandler: [...mainPreHandlers, import_csrf.csrfProtection],
    handler: import_subs.addSubreddit,
    schema: import_api_router_schema.addUserSubSchema
  });
  fastify.post("/remove-user-subreddit", {
    preHandler: [...mainPreHandlers, import_csrf.csrfProtection],
    handler: import_subs.removeSubreddit,
    schema: import_api_router_schema.removeUserSubSchema
  });
  fastify.post("/bulk-import-user-subs", {
    preHandler: [...mainPreHandlers, import_csrf.csrfProtection],
    handler: import_subs.bulkImportSubreddits,
    schema: import_api_router_schema.bulkImportUserSubsSchema
  });
  done();
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  apiRoutes
});
