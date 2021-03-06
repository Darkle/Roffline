const updateUserSettingsSchema = {
  body: {
    type: 'object',
    // Sometimes the csrf token is sent via request headers in the fetch, and sometimes its sent as the body of a form.
    required: ['settingName', 'settingValue'],
    properties: {
      settingName: { enum: ['hideStickiedPosts', 'onlyShowTitlesInFeed', 'infiniteScroll', 'darkModeTheme'] },
      settingValue: { type: 'boolean' },
      csrfToken: { type: 'string' },
    },
  },
}

const bulkImportUserSubsSchema = {
  body: {
    type: 'object',
    required: ['subsToImport'],
    properties: {
      subsToImport: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'string',
        },
      },
    },
  },
}

const addUserSubSchema = {
  body: {
    type: 'object',
    required: ['subToAdd'],
    properties: {
      subToAdd: {
        type: 'string',
      },
    },
  },
}

const removeUserSubSchema = {
  body: {
    type: 'object',
    required: ['subToRemove'],
    properties: {
      subToRemove: {
        type: 'string',
      },
    },
  },
}

const logUserInSchema = {
  body: {
    type: 'object',
    required: ['csrfToken'],
    properties: {
      csrfToken: {
        type: 'string',
      },
      loginUsername: {
        type: 'string',
      },
    },
  },
}

const createUserInSchema = {
  body: {
    type: 'object',
    required: ['csrfToken'],
    properties: {
      csrfToken: {
        type: 'string',
      },
      signupUsername: {
        type: 'string',
      },
    },
  },
}

const updateAdminSettingsSchema = {
  body: {
    type: 'object',
    // Sometimes the csrf token is sent via request headers in the fetch, and sometimes its sent as the body of a form.
    required: ['settingName', 'settingValue'],
    properties: {
      settingName: {
        enum: [
          'downloadComments',
          'numberFeedsOrPostsDownloadsAtOnce',
          'numberMediaDownloadsAtOnce',
          'downloadVideos',
          'videoDownloadMaxFileSize',
          'videoDownloadResolution',
          'updateAllDay',
          'updateStartingHour',
          'updateEndingHour',
          'downloadImages',
          'downloadArticles',
        ],
      },
      settingValue: { type: ['boolean', 'number', 'string'] },
      csrfToken: { type: 'string' },
    },
  },
}

const adminCancelDownloadSchema = {
  body: {
    type: 'object',
    required: ['downloadToCancel'],
    properties: {
      downloadToCancel: { type: 'string' },
    },
  },
}

const adminGetPaginatedTableDataSchema = {
  querystring: {
    type: 'object',
    required: ['tableName', 'page'],
    properties: {
      tableName: { type: 'string' },
      page: { type: 'integer' },
      searchTerm: { type: 'string' },
    },
  },
}

const deleteUserSchema = {
  body: {
    type: 'object',
    required: ['userToDelete'],
    properties: {
      userToDelete: { type: 'string' },
      csrfToken: { type: 'string' },
    },
  },
}

export {
  updateUserSettingsSchema,
  bulkImportUserSubsSchema,
  addUserSubSchema,
  removeUserSubSchema,
  logUserInSchema,
  createUserInSchema,
  updateAdminSettingsSchema,
  adminGetPaginatedTableDataSchema,
  deleteUserSchema,
  adminCancelDownloadSchema,
}
