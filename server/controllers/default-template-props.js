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
  setDefaultTemplateProps: () => setDefaultTemplateProps
});
var import_querystring = __toModule(require("querystring"));
var import_package = __toModule(require("../../package.json"));
var import_utils = __toModule(require("../utils"));
var import_csrf = __toModule(require("./csrf"));
function setDefaultTemplateProps(request, reply, done) {
  var _a, _b;
  const path = request.urlData().path;
  const basePath = path.split("/")[1];
  const csrfToken = (0, import_csrf.createCsrfToken)();
  const replyWithLocals = reply;
  if (!replyWithLocals.locals) {
    replyWithLocals.locals = {
      basePath: path === "/" ? "index" : basePath,
      isSubPage: request.url.startsWith("/sub/"),
      currentSubredditBrowsing: (_a = request.url.split("/")[2]) == null ? void 0 : _a.split("?")[0],
      cacheBustString: `?cachebust=${import_utils.isDev ? Date.now().toString() : import_package.version}`,
      csrfToken,
      unescapeHTML: import_querystring.default.unescape,
      isDev: import_utils.isDev
    };
  } else {
    replyWithLocals.locals.basePath = path === "/" ? "index" : basePath;
    replyWithLocals.locals.isSubPage = request.url.startsWith("/sub/");
    replyWithLocals.locals.currentSubredditBrowsing = (_b = request.url.split("/")[2]) == null ? void 0 : _b.split("?")[0];
    replyWithLocals.locals.cacheBustString = `?cachebust=${import_utils.isDev ? Date.now().toString() : import_package.version}`;
    replyWithLocals.locals.csrfToken = csrfToken;
    replyWithLocals.locals.isDev = import_utils.isDev;
  }
  done();
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  setDefaultTemplateProps
});
