import * as Vue from 'vue'
import VueSplide from '@splidejs/vue-splide'

import { WindowWithProps } from '../frontend-global-types'
import { PostItem } from './components/PostItem'
import { ignoreScriptTagCompilationWarnings } from '../frontend-utils'

declare const window: WindowWithProps

const IndexPage = Vue.defineComponent({
  data() {
    return {
      posts: window.posts,
      userSettings: window.userSettings,
      totalResults: window.totalResults,
    }
  },
  components: {
    PostItem,
  },
})

const app = Vue.createApp(IndexPage)

// warnHandler is ignored in production https://v3.vuejs.org/api/application-config.html#warnhandler
app.config.warnHandler = ignoreScriptTagCompilationWarnings

app.use(VueSplide).mount('body')
