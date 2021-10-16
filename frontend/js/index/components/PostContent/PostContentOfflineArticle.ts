import * as Vue from 'vue'

import { FrontendPost } from '../../../frontend-global-types'

const PostContentOfflineArticleLink = Vue.defineComponent({
  props: {
    post: Object as Vue.PropType<FrontendPost>,
  },
  methods: {
    safeEncodeURIComponent(str: string | undefined): string {
      return encodeURIComponent(str || '')
    },
    generateHref(file: string): string {
      const postId = this.post?.id as string

      return `/posts-media/${postId}/${this.safeEncodeURIComponent(file)}`
    },
    isHtmlFile(file: string) {
      return /^hello/u.test(file)
    },
  },
  template: /* html */ `
    <div class="webpage-scrape-links-container">
      <div class="offline-article-link" v-for="file in post.downloadedFiles>
        <span class="isHtmlFile(file) ? 'html-offline-link' : ''">
          {{ isHtmlFile(file) ? '⎋' : '※' }}
        </span>
        <a href="generateHref(file)">
          {{ isHtmlFile(file) ? 'Offline Article Link' : 'Screenshot Of Article' }}
        </a>
      </div>
    </div>
`,
})

export { PostContentOfflineArticleLink }
