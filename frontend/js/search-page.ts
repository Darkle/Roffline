import * as Vue from 'vue'

import { ignoreScriptTagCompilationWarnings } from './frontend-utils'

const getLocallyStoredFuzzySearchSetting = (): boolean => {
  const fuzzySearch = localStorage.getItem('fuzzySearch')
  return fuzzySearch === 'true'
}

const SearchPage = Vue.defineComponent({
  data() {
    return {
      fuzzySearchEnabled: getLocallyStoredFuzzySearchSetting(),
    }
  },
  watch: {
    fuzzySearchEnabled(newValue) {
      localStorage.setItem('fuzzySearch', newValue)
    },
  },
})

const app = Vue.createApp(SearchPage)

// warnHandler is ignored in production https://v3.vuejs.org/api/application-config.html#warnhandler
app.config.warnHandler = ignoreScriptTagCompilationWarnings

app.mount('body')
