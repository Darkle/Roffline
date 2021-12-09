import * as R from 'ramda'
import * as Vue from 'vue'

import { Fetcher, ignoreScriptTagCompilationWarnings } from '../frontend-utils'
import type { AdminSettingsPageWindowWithProps, AdminSettingsForFrontend } from './admin-frontend-global-types'

declare const window: AdminSettingsPageWindowWithProps

const state = Vue.reactive({ ...window.adminSettings })

function findObjectDifference(
  newState: AdminSettingsForFrontend,
  prevState: AdminSettingsForFrontend
  // @ts-expect-error We know this will return
): {
  settingName: string
  settingValue: AdminSettingsForFrontend[keyof AdminSettingsForFrontend]
} {
  // eslint-disable-next-line functional/no-loop-statement,no-restricted-syntax
  for (const settingName of Object.keys(newState)) {
    const newSetting = newState[settingName as keyof AdminSettingsForFrontend]
    const oldSetting = prevState[settingName as keyof AdminSettingsForFrontend]

    // eslint-disable-next-line functional/no-conditional-statement
    if (newSetting !== oldSetting) {
      return { settingName, settingValue: newSetting }
    }
  }
}

Vue.watch(
  () => R.clone(state),
  (newState, prevState) => {
    const { settingName, settingValue } = findObjectDifference({ ...newState }, { ...prevState })

    Fetcher.putJSON('/admin/api/update-admin-setting', { settingName, settingValue }).catch(err =>
      console.error(err)
    )
  },
  { deep: true }
)

const AdminSettingsPage = Vue.defineComponent({
  data() {
    return state
  },
})

const app = Vue.createApp(AdminSettingsPage)

// warnHandler is ignored in production https://v3.vuejs.org/api/application-config.html#warnhandler
app.config.warnHandler = ignoreScriptTagCompilationWarnings

app.mount('main')
