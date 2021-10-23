import * as Vue from 'vue'

import { SettingsPageWindowWithProps } from './frontend-global-types'
import { ignoreScriptTagCompilationWarnings } from './frontend-utils'

declare const window: SettingsPageWindowWithProps

const SettingsPage = Vue.defineComponent({
  data() {
    return {
      userSettings: window.userSettings,
    }
  },
  methods: {},
})

const app = Vue.createApp(SettingsPage)

// warnHandler is ignored in production https://v3.vuejs.org/api/application-config.html#warnhandler
app.config.warnHandler = ignoreScriptTagCompilationWarnings

app.mount('body')
