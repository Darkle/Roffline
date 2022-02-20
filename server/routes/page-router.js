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
  pageRoutes: () => pageRoutes
});
var import_user = __toModule(require("../controllers/user"));
var import_default_template_props = __toModule(require("../controllers/default-template-props"));
var import_posts = __toModule(require("../controllers/posts/posts"));
var import_search = __toModule(require("../controllers/search"));
var import_single_post = __toModule(require("../controllers/posts/single-post"));
var import_package = __toModule(require("../../package.json"));
var import_csrf = __toModule(require("../controllers/csrf"));
const mainPreHandlers = [import_user.checkUserLoggedIn, import_default_template_props.setDefaultTemplateProps, import_user.getUserSettings];
const pageRoutes = (fastify, __, done) => {
  fastify.get("/login", { preHandler: import_user.redirectLoginPageToHomeIfAlreadyLoggedIn }, (req, reply) => {
    const userNotFound = req.cookies["userNotFound"];
    reply.clearCookie("userNotFound").view("login-page", {
      pageTitle: "Roffline - Login",
      uniqueUsername: (0, import_user.generateRandomUniqueUsername)(),
      csrfToken: (0, import_csrf.createCsrfToken)(),
      userNotFound,
      isLoginPage: true
    });
  });
  fastify.get("/logout", import_user.logUserOut);
  fastify.get("/", { preHandler: [...mainPreHandlers, import_posts.getPostsPaginated] }, (_, reply) => {
    reply.view("index", {
      pageTitle: "Roffline Home Page"
    });
  });
  fastify.get("/r/*", (req, reply) => {
    const urlData = req.urlData();
    reply.redirect(`https://www.reddit.com${urlData.path}`);
  });
  fastify.get("/post/:postId/", { preHandler: [...mainPreHandlers, import_single_post.generatePost] }, (_, reply) => {
    reply.view("post-page");
  });
  fastify.get("/sub/:subreddit/", { preHandler: [...mainPreHandlers, import_posts.getPostsPaginatedForSubreddit] }, (req, reply) => {
    reply.view("index", { pageTitle: `${req.params.subreddit} - Roffline` });
  });
  fastify.get("/settings", { preHandler: mainPreHandlers }, (_, reply) => {
    reply.view("settings-page", { pageTitle: "Roffline Settings" });
  });
  fastify.get("/sub-management", { preHandler: mainPreHandlers }, (_, reply) => {
    reply.view("sub-management-page", { pageTitle: "Roffline - Subreddit Management" });
  });
  fastify.get("/search", { preHandler: [...mainPreHandlers, import_search.searchPosts] }, (_, reply) => {
    reply.view("search-page", { pageTitle: "Search Roffline" });
  });
  fastify.get("/help", { preHandler: mainPreHandlers }, (_, reply) => {
    reply.view("help-page", { pageTitle: "Roffline Help", appVersion: import_package.version });
  });
  done();
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  pageRoutes
});
