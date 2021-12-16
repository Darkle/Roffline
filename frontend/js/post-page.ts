import * as Vue from 'vue'
import VueSplide from '@splidejs/vue-splide'

import type { PostPageWindowWithProps } from './frontend-global-types'
import { ignoreScriptTagCompilationWarnings } from './frontend-utils'
import { PostContentItem } from './components/PostContent/PostContentItem'
import { PostContentItemMetaContainer } from './components/PostContentItemMetaContainer'
import { Comments } from './components/Comments'
import type { PostWithComments } from '../../db/entities/Posts/Post'

declare const window: PostPageWindowWithProps

const PostPage = Vue.defineComponent({
  data() {
    return {
      post: window.post,
      userSettings: window.userSettings,
    }
  },
  components: {
    PostContentItem,
    PostContentItemMetaContainer,
    Comments,
  },
  computed: {
    postTitle(): string {
      // unescape to convert &amp; to &. Eg https://api.reddit.com/api/info/?id=t3_qaolx9
      return unescape(this.post?.title)
    },
    commentsNotYetDownloaded(): boolean {
      return this.post.comments === null
    },
    haveComments(): boolean {
      const comments = this.post.comments as PostWithComments['comments']
      return Array.isArray(comments) ? comments.length > 0 : false
    },
  },
  template: /* html */ `
    <article>
      <h1 class="post-title">{{ postTitle }}</h1>
        <post-content-item 
          v-bind:post="post"
        ></post-content-item>
        <post-content-item-meta-container
          v-bind:post="post"
        ></post-content-item-meta-container>
    </article>
    <hr />
    <section class="comments">
      <h5>Comments:</h5>
      <small v-if="commentsNotYetDownloaded">Comments are currently being downloaded for this post.</small>
      <comments v-else-if="haveComments"
        v-bind:comments="post.comments"
      ></comments>
    </section> 
    `,
})

const app = Vue.createApp(PostPage)

// warnHandler is ignored in production https://v3.vuejs.org/api/application-config.html#warnhandler
app.config.warnHandler = ignoreScriptTagCompilationWarnings

app.use(VueSplide).mount('main')
