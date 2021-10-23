const updateUserSettingsSchema = {
  body: {
    type: 'object',
    required: ['settingName', 'settingValue', 'csrfToken'],
    properties: {
      settingName: { enum: ['hideStickiedPosts', 'onlyShowTitlesInFeed', 'infiniteScroll', 'darkModeTheme'] },
      settingValue: { type: 'boolean' },
      csrfToken: { type: 'string' },
    },
  },
}

export { updateUserSettingsSchema }
