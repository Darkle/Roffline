import * as Vue from 'vue'
import VueSplide from '@splidejs/vue-splide'
import * as R from 'ramda'
import * as RA from 'ramda-adjunct'

import type { FrontendPost, IndexPageWindowWithProps } from './frontend-global-types'
import { PostItem } from './components/PostItem'

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

app.use(VueSplide).mount('main')
