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
  checkUserLoggedIn: () => checkUserLoggedIn,
  createUser: () => createUser,
  generateRandomUniqueUsername: () => generateRandomUniqueUsername,
  getUserSettings: () => getUserSettings,
  logUserIn: () => logUserIn,
  logUserOut: () => logUserOut,
  redirectLoginPageToHomeIfAlreadyLoggedIn: () => redirectLoginPageToHomeIfAlreadyLoggedIn,
  updateUserSetting: () => updateUserSetting
});
var import_crypto = __toModule(require("crypto"));
var import_http_status_codes = __toModule(require("http-status-codes"));
var R = __toModule(require("ramda"));
var RA = __toModule(require("ramda-adjunct"));
var import_diceware = __toModule(require("diceware"));
var import_db = __toModule(require("../../db/db"));
const fourYearsInMilliseconds = 1257984e5;
const getCookieProperties = () => ({
  httpOnly: true,
  sameSite: true,
  expires: new Date(Date.now() + fourYearsInMilliseconds),
  path: "/"
});
const isApiRoute = R.startsWith("/api/");
const isValidCookie = RA.isNotNilOrEmpty;
const isLoginLogoutPage = (path) => path === "/login" || path === "/login/" || path === "/logout" || path === "/logout/";
async function getUserSettings(req, reply) {
  const user = req.cookies["loggedInUser"];
  await import_db.db.getUserSettings(user).then((userSettings) => {
    const replyWithLocals = reply;
    replyWithLocals.locals.userSettings = userSettings;
  });
}
async function updateUserSetting(req, reply) {
  const { settingName, settingValue } = req.body;
  const user = req.cookies["loggedInUser"];
  await import_db.db.setUserSpecificSetting(user, settingName, settingValue);
  return reply.code(import_http_status_codes.StatusCodes.OK).send();
}
function logUserOut(_, reply) {
  reply.clearCookie("loggedInUser").redirect("/login");
}
const userNotLoggedInResponse = (reply, path) => {
  isApiRoute(path) ? reply.code(import_http_status_codes.StatusCodes.UNAUTHORIZED).send() : reply.code(import_http_status_codes.StatusCodes.TEMPORARY_REDIRECT).clearCookie("loggedInUser").redirect("/login");
};
async function checkUserLoggedIn(req, reply, next) {
  const loggedInUser = req.cookies["loggedInUser"];
  const path = req.urlData().path;
  if (isLoginLogoutPage(path)) {
    return next();
  }
  if (!isValidCookie(loggedInUser)) {
    return userNotLoggedInResponse(reply, path);
  }
  await import_db.db.findUser(loggedInUser).then((maybeUser) => maybeUser.cata({
    Just: RA.noop,
    Nothing: () => userNotLoggedInResponse(reply, path)
  }));
}
function redirectLoginPageToHomeIfAlreadyLoggedIn(req, reply, next) {
  const loggedInUser = req.cookies["loggedInUser"];
  const path = req.urlData().path;
  if (!isValidCookie(loggedInUser) || !isLoginLogoutPage(path))
    return next();
  return reply.code(import_http_status_codes.StatusCodes.TEMPORARY_REDIRECT).redirect("/");
}
async function logUserIn(req, reply) {
  const { loginUsername } = req.body;
  const maybeUser = await import_db.db.findUser(loginUsername.trim());
  maybeUser.cata({
    Just: () => reply.setCookie("loggedInUser", loginUsername, getCookieProperties()).redirect("/"),
    Nothing: () => reply.setCookie("userNotFound", loginUsername, getCookieProperties()).redirect("/login")
  });
}
async function createUser(req, reply) {
  const { signupUsername } = req.body;
  await import_db.db.createUser(signupUsername);
  reply.setCookie("loggedInUser", signupUsername, getCookieProperties()).redirect("/");
}
const numberOfDicewareWordsToGenerate = 4;
const generateRandomUniqueUsername = () => `${(0, import_diceware.default)(numberOfDicewareWordsToGenerate).split(" ").join("-")}-${import_crypto.default.randomInt(0, 10)}`;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  checkUserLoggedIn,
  createUser,
  generateRandomUniqueUsername,
  getUserSettings,
  logUserIn,
  logUserOut,
  redirectLoginPageToHomeIfAlreadyLoggedIn,
  updateUserSetting
});
