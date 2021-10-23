import * as Vue from 'vue'

import { SettingsPageWindowWithProps } from './frontend-global-types'
import { Fetcher, ignoreScriptTagCompilationWarnings } from './frontend-utils'

declare const window: SettingsPageWindowWithProps

const SettingsPage = Vue.defineComponent({
  data() {
    return {
      name: window.name,
      subreddits: window.userSettings.subreddits,
      hideStickiedPosts: window.userSettings.hideStickiedPosts,
      onlyShowTitlesInFeed: window.userSettings.onlyShowTitlesInFeed,
      infiniteScroll: window.userSettings.infiniteScroll,
      darkModeTheme: window.userSettings.darkModeTheme,
    }
  },
  methods: {
    updateSetting(event: Event) {
      const inputElement = event.target as HTMLInputElement
      const { settingName } = inputElement.dataset

      const data = { settingName, settingValue: inputElement.checked }

      Fetcher.putJSON('/api/update-user-setting', data).catch(err => console.error(err))
    },
    updateDarkTheme(event: Event) {
      this.updateSetting(event)
      const inputElement = event.target as HTMLInputElement
      const body = document.querySelector('body') as HTMLBodyElement

      inputElement.checked ? body.classList.add('dark-theme') : body.classList.remove('dark-theme')
    },
  },
})

const app = Vue.createApp(SettingsPage)

// warnHandler is ignored in production https://v3.vuejs.org/api/application-config.html#warnhandler
app.config.warnHandler = ignoreScriptTagCompilationWarnings

app.mount('body')
