import * as Vue from 'vue'

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
    fuzzySearchEnabled(newValue: boolean) {
      localStorage.setItem('fuzzySearch', newValue.toString())
    },
  },
})

const app = Vue.createApp(SearchPage)

app.mount('main')
