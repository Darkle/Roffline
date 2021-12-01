import * as Vue from 'vue'
import VueSplide from '@splidejs/vue-splide'
import * as R from 'ramda'
import * as RA from 'ramda-adjunct'

import { FrontendPost, IndexPageWindowWithProps } from './frontend-global-types'
import { PostItem } from './components/PostItem'
import { ignoreScriptTagCompilationWarnings } from './frontend-utils'

declare const window: IndexPageWindowWithProps

const IndexPage = Vue.defineComponent({
  data() {
    return {
      posts: window.posts,
      userSettings: window.userSettings,
      totalResults: window.totalResults,
    }
  },
  methods: {
    updatePosts(posts: FrontendPost[]) {
      // Sort the posts by created_utc for the off chance that two fetch requests happen in quick succession and they are returned out of order.
      const sortNewestPostsFirst = R.compose(p => p.reverse(), RA.sortByProps(['created_utc'])) // eslint-disable-line functional/immutable-data
      this.posts = sortNewestPostsFirst([...this.posts, ...posts]) as FrontendPost[]
    },
  },
  components: {
    PostItem,
  },
})

const app = Vue.createApp(IndexPage)

// warnHandler is ignored in production https://v3.vuejs.org/api/application-config.html#warnhandler
app.config.warnHandler = ignoreScriptTagCompilationWarnings

app.use(VueSplide).mount('body')
