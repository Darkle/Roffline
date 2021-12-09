import * as Vue from 'vue'

import type { FrontendPost } from '../../frontend-global-types'
import { OfflineArticleIcon } from './OfflineArticleIcon'

const PostContentOfflineArticleLink = Vue.defineComponent({
  props: {
    post: Object as Vue.PropType<FrontendPost>,
    isFirstUrlOfTextPost: Boolean,
  },
  components: {
    OfflineArticleIcon,
  },
  methods: {
    safeEncodeURIComponent(str: string | undefined): string {
      return encodeURIComponent(str || '')
    },
    generateHref(file: string): string {
      const postId = this.post?.id as string

      return `/posts-media/${postId}/${this.safeEncodeURIComponent(file)}`
    },
  },
  computed: {
    offlineArticleLinkText() {
      return `Offline Article Link ${this.isFirstUrlOfTextPost ? '(First Url In Text)' : ''}`
    },
  },
  template: /* html */ `
    <div class="offline-article-link">
      <a v-bind:href="generateHref(post.downloadedFiles[0])" target="_blank" rel="noopener">
        <offline-article-icon></offline-article-icon>
        <span>{{offlineArticleLinkText}}</span>
      </a>
    </div>
`,
})

export { PostContentOfflineArticleLink }
