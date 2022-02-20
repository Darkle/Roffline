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
  cancelDownload: () => cancelDownload
});
var import_http_status_codes = __toModule(require("http-status-codes"));
var import_tree_kill = __toModule(require("tree-kill"));
var import_direct_media_download = __toModule(require("../../../downloads/media/direct-media-download"));
var import_spawn_external_download_process = __toModule(require("../../../downloads/media/spawn-external-download-process"));
var import_media_downloads_viewer_organiser = __toModule(require("../../../downloads/media/media-downloads-viewer-organiser"));
async function cancelDownload(req, reply) {
  var _a;
  const { downloadToCancel } = req.body;
  if (import_direct_media_download.directDownloadReferences.has(downloadToCancel)) {
    (_a = import_direct_media_download.directDownloadReferences.get(downloadToCancel)) == null ? void 0 : _a.stop();
    import_media_downloads_viewer_organiser.adminMediaDownloadsViewerOrganiser.setDownloadCancelled(downloadToCancel, "User cancelled download from admin downloads page.");
  }
  if (import_spawn_external_download_process.spawnedDownloadProcessReferences.has(downloadToCancel)) {
    (0, import_tree_kill.default)(import_spawn_external_download_process.spawnedDownloadProcessReferences.get(downloadToCancel));
    import_media_downloads_viewer_organiser.adminMediaDownloadsViewerOrganiser.setDownloadCancelled(downloadToCancel, "User cancelled download from admin downloads page.");
  }
  return reply.code(import_http_status_codes.StatusCodes.OK).send();
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  cancelDownload
});
