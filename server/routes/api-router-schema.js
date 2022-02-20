var __defProp = Object.defineProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
__export(exports, {
  addUserSubSchema: () => addUserSubSchema,
  adminCancelDownloadSchema: () => adminCancelDownloadSchema,
  adminGetPaginatedTableDataSchema: () => adminGetPaginatedTableDataSchema,
  bulkImportUserSubsSchema: () => bulkImportUserSubsSchema,
  createUserInSchema: () => createUserInSchema,
  deleteUserSchema: () => deleteUserSchema,
  logUserInSchema: () => logUserInSchema,
  removeUserSubSchema: () => removeUserSubSchema,
  updateAdminSettingsSchema: () => updateAdminSettingsSchema,
  updateUserSettingsSchema: () => updateUserSettingsSchema
});
const updateUserSettingsSchema = {
  body: {
    type: "object",
    required: ["settingName", "settingValue"],
    properties: {
      settingName: { enum: ["hideStickiedPosts", "onlyShowTitlesInFeed", "infiniteScroll", "darkModeTheme"] },
      settingValue: { type: "boolean" },
      csrfToken: { type: "string" }
    }
  }
};
const bulkImportUserSubsSchema = {
  body: {
    type: "object",
    required: ["subsToImport"],
    properties: {
      subsToImport: {
        type: "array",
        minItems: 1,
        items: {
          type: "string"
        }
      }
    }
  }
};
const addUserSubSchema = {
  body: {
    type: "object",
    required: ["subToAdd"],
    properties: {
      subToAdd: {
        type: "string"
      }
    }
  }
};
const removeUserSubSchema = {
  body: {
    type: "object",
    required: ["subToRemove"],
    properties: {
      subToRemove: {
        type: "string"
      }
    }
  }
};
const logUserInSchema = {
  body: {
    type: "object",
    required: ["csrfToken"],
    properties: {
      csrfToken: {
        type: "string"
      },
      loginUsername: {
        type: "string"
      }
    }
  }
};
const createUserInSchema = {
  body: {
    type: "object",
    required: ["csrfToken"],
    properties: {
      csrfToken: {
        type: "string"
      },
      signupUsername: {
        type: "string"
      }
    }
  }
};
const updateAdminSettingsSchema = {
  body: {
    type: "object",
    required: ["settingName", "settingValue"],
    properties: {
      settingName: {
        enum: [
          "downloadComments",
          "numberFeedsOrPostsDownloadsAtOnce",
          "numberMediaDownloadsAtOnce",
          "downloadVideos",
          "videoDownloadMaxFileSize",
          "videoDownloadResolution",
          "updateAllDay",
          "updateStartingHour",
          "updateEndingHour"
        ]
      },
      settingValue: { type: ["boolean", "number", "string"] },
      csrfToken: { type: "string" }
    }
  }
};
const adminCancelDownloadSchema = {
  body: {
    type: "object",
    required: ["downloadToCancel"],
    properties: {
      downloadToCancel: { type: "string" }
    }
  }
};
const adminGetPaginatedTableDataSchema = {
  querystring: {
    type: "object",
    required: ["tableName", "page"],
    properties: {
      tableName: { type: "string" },
      page: { type: "integer" },
      searchTerm: { type: "string" }
    }
  }
};
const deleteUserSchema = {
  body: {
    type: "object",
    required: ["userToDelete"],
    properties: {
      userToDelete: { type: "string" },
      csrfToken: { type: "string" }
    }
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  addUserSubSchema,
  adminCancelDownloadSchema,
  adminGetPaginatedTableDataSchema,
  bulkImportUserSubsSchema,
  createUserInSchema,
  deleteUserSchema,
  logUserInSchema,
  removeUserSubSchema,
  updateAdminSettingsSchema,
  updateUserSettingsSchema
});
