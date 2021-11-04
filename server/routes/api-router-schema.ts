const updateUserSettingsSchema = {
  body: {
    type: 'object',
    // Sometimes the csrf token is send via request headers in the fetch, and sometimes its sent as the body of a form.
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

export {
  updateUserSettingsSchema,
  bulkImportUserSubsSchema,
  addUserSubSchema,
  removeUserSubSchema,
  logUserInSchema,
}
