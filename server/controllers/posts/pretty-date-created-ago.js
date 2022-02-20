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
  genPrettyDateCreatedAgoFromUTC: () => genPrettyDateCreatedAgoFromUTC
});
var import_luxon = __toModule(require("luxon"));
function genPrettyDateCreatedAgoFromUTC(unixTimestamp) {
  const postCreatedTime = import_luxon.DateTime.fromSeconds(unixTimestamp, { zone: "Etc/UTC" });
  const now = import_luxon.DateTime.fromJSDate(new Date());
  const dateDiff = now.diff(postCreatedTime, ["seconds", "minutes", "hours", "days", "weeks", "months", "years"]).toObject();
  if (dateDiff.years > 0) {
    return `${dateDiff.years.toFixed()} year${dateDiff.years > 1 ? "s" : ""} ago`;
  }
  if (dateDiff.months > 0) {
    return `${dateDiff.months.toFixed()} month${dateDiff.months > 1 ? "s" : ""} ago`;
  }
  if (dateDiff.weeks === 1) {
    const days = dateDiff.days + 7;
    return `${days.toFixed()} days ago`;
  }
  if (dateDiff.weeks > 1) {
    return `${dateDiff.weeks.toFixed()} week${dateDiff.weeks > 1 ? "s" : ""} ago`;
  }
  if (dateDiff.days > 0) {
    return `${dateDiff.days.toFixed()} day${dateDiff.days > 1 ? "s" : ""} ago`;
  }
  if (dateDiff.hours > 0) {
    return `${dateDiff.hours.toFixed()} hour${dateDiff.hours > 1 ? "s" : ""} ago`;
  }
  if (dateDiff.minutes > 0) {
    return `${dateDiff.minutes.toFixed()} minute${dateDiff.minutes > 1 ? "s" : ""} ago`;
  }
  if (dateDiff.seconds > 0) {
    return `${dateDiff.seconds.toFixed()} second${dateDiff.seconds > 1 ? "s" : ""} ago`;
  }
  return "";
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  genPrettyDateCreatedAgoFromUTC
});
