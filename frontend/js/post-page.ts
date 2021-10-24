import * as Vue from 'vue'
import VueSplide from '@splidejs/vue-splide'

import { PostPageWindowWithProps } from './frontend-global-types'
import { ignoreScriptTagCompilationWarnings } from './frontend-utils'
import { PostContentItem } from './components/PostContent/PostContentItem'
import { PostContentItemMetaContainer } from './components/PostContentItemMetaContainer'

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
  },
  computed: {
    postTitle(): string {
      // unescape to convert &amp; to &. Eg https://api.reddit.com/api/info/?id=t3_qaolx9
      return unescape(this.post?.title as string)
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
      {{ post.comments }}
    </section> 
    `,
})

const app = Vue.createApp(PostPage)

// warnHandler is ignored in production https://v3.vuejs.org/api/application-config.html#warnhandler
app.config.warnHandler = ignoreScriptTagCompilationWarnings

app.use(VueSplide).mount('main')
