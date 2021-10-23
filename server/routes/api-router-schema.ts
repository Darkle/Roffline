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

export { updateUserSettingsSchema }
