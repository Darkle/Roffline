var __create = Object.create;
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
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
  SSEHandler: () => SSEHandler
});
var R = __toModule(require("ramda"));
var import_ramda_adjunct = __toModule(require("ramda-adjunct"));
var import_ts_pattern = __toModule(require("ts-pattern"));
var import_media_downloads_viewer_organiser = __toModule(require("../../../downloads/media/media-downloads-viewer-organiser"));
const removePropsWithNoData = R.pickBy((val) => (0, import_ts_pattern.match)(val).with(import_ts_pattern.__.string, import_ramda_adjunct.default.isNonEmptyString).with(import_ts_pattern.__.number, (v) => v > 0).with(import_ts_pattern.__.boolean, (v) => v !== false).with(import_ts_pattern.__.nullish, () => false).otherwise(() => true));
const stringifyAnyErrors = (download) => __spreadProps(__spreadValues({}, download), {
  downloadError: R.when(import_ramda_adjunct.default.isError, R.toString, download.downloadError)
});
const convertDownloadsMapForFrontend = (downloads) => [...downloads.values()].map(R.pick([
  "id",
  "url",
  "permalink",
  "mediaDownloadTries",
  "downloadFailed",
  "downloadError",
  "downloadCancelled",
  "downloadCancellationReason",
  "downloadSkipped",
  "downloadSkippedReason",
  "downloadStarted",
  "downloadSucceeded",
  "downloadProgress",
  "downloadSpeed",
  "downloadedBytes",
  "downloadFileSize"
])).map(stringifyAnyErrors).map(removePropsWithNoData);
const createSSEEvent = ({ event, data }) => `event: ${event}
data: ${JSON.stringify(data)}

`;
function SSEHandler(request, reply) {
  reply.raw.setHeader("Content-Type", "text/event-stream");
  reply.raw.setHeader("Cache-Control", "no-cache");
  reply.raw.setHeader("x-no-compression", "true");
  reply.raw.setHeader("Connection", "keep-alive");
  reply.raw.write(createSSEEvent({
    event: "page-load",
    data: convertDownloadsMapForFrontend(import_media_downloads_viewer_organiser.adminMediaDownloadsViewerOrganiser.posts)
  }));
  const newDownloadBatchStarted = (downloads) => {
    reply.raw.write(createSSEEvent({
      event: "new-download-batch-started",
      data: convertDownloadsMapForFrontend(downloads)
    }));
  };
  const downloadsCleared = () => {
    reply.raw.write(createSSEEvent({
      event: "downloads-cleared",
      data: null
    }));
  };
  const aDownloadStarted = (postId) => {
    reply.raw.write(createSSEEvent({
      event: "download-started",
      data: { postId }
    }));
  };
  const aDownloadFailed = (postId, err) => {
    const error = err ? err.toString() : "";
    reply.raw.write(createSSEEvent({
      event: "download-failed",
      data: { postId, err: error }
    }));
  };
  const aDownloadSucceeded = (postId) => {
    reply.raw.write(createSSEEvent({
      event: "download-succeeded",
      data: { postId }
    }));
  };
  const aDownloadCancelled = (postId, reason) => {
    reply.raw.write(createSSEEvent({
      event: "download-cancelled",
      data: { postId, reason }
    }));
  };
  const aDownloadSkipped = (postId, reason) => {
    reply.raw.write(createSSEEvent({
      event: "download-skipped",
      data: { postId, reason }
    }));
  };
  const progressOfADownload = (postId, downloadFileSize, downloadedBytes, downloadSpeed, downloadProgress) => {
    reply.raw.write(createSSEEvent({
      event: "download-progress",
      data: { postId, downloadFileSize, downloadedBytes, downloadSpeed, downloadProgress }
    }));
  };
  import_media_downloads_viewer_organiser.adminMediaDownloadsViewerOrganiserEmitter.on("new-download-batch-started", newDownloadBatchStarted);
  import_media_downloads_viewer_organiser.adminMediaDownloadsViewerOrganiserEmitter.on("downloads-cleared", downloadsCleared);
  import_media_downloads_viewer_organiser.adminMediaDownloadsViewerOrganiserEmitter.on("download-started", aDownloadStarted);
  import_media_downloads_viewer_organiser.adminMediaDownloadsViewerOrganiserEmitter.on("download-failed", aDownloadFailed);
  import_media_downloads_viewer_organiser.adminMediaDownloadsViewerOrganiserEmitter.on("download-succeeded", aDownloadSucceeded);
  import_media_downloads_viewer_organiser.adminMediaDownloadsViewerOrganiserEmitter.on("download-cancelled", aDownloadCancelled);
  import_media_downloads_viewer_organiser.adminMediaDownloadsViewerOrganiserEmitter.on("download-skipped", aDownloadSkipped);
  import_media_downloads_viewer_organiser.adminMediaDownloadsViewerOrganiserEmitter.on("download-progress", progressOfADownload);
  request.raw.on("close", () => {
    import_media_downloads_viewer_organiser.adminMediaDownloadsViewerOrganiserEmitter.removeListener("new-download-batch-started", newDownloadBatchStarted);
    import_media_downloads_viewer_organiser.adminMediaDownloadsViewerOrganiserEmitter.removeListener("downloads-cleared", downloadsCleared);
    import_media_downloads_viewer_organiser.adminMediaDownloadsViewerOrganiserEmitter.removeListener("download-started", aDownloadStarted);
    import_media_downloads_viewer_organiser.adminMediaDownloadsViewerOrganiserEmitter.removeListener("download-failed", aDownloadFailed);
    import_media_downloads_viewer_organiser.adminMediaDownloadsViewerOrganiserEmitter.removeListener("download-succeeded", aDownloadSucceeded);
    import_media_downloads_viewer_organiser.adminMediaDownloadsViewerOrganiserEmitter.removeListener("download-cancelled", aDownloadCancelled);
    import_media_downloads_viewer_organiser.adminMediaDownloadsViewerOrganiserEmitter.removeListener("download-skipped", aDownloadSkipped);
    import_media_downloads_viewer_organiser.adminMediaDownloadsViewerOrganiserEmitter.removeListener("download-progress", progressOfADownload);
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SSEHandler
});
