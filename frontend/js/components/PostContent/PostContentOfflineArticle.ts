import * as Vue from 'vue'

import type { FrontendPost } from '../../frontend-global-types'

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
      return /.*\.(htm$|html$)/u.test(file)
    },
  },
  template: /* html */ `
    <div class="webpage-scrape-links-container">
      <div class="offline-article-link" v-for="file in post.downloadedFiles">
        <span class="html-offline-link" v-if="isHtmlFile(file)" >
          <svg height="32px" version="1.1" viewBox="0 0 32 32" width="32px" xmlns="http://www.w3.org/2000/svg" xmlns:sketch="http://www.bohemiancoding.com/sketch/ns" xmlns:xlink="http://www.w3.org/1999/xlink">
              <g fill="none" fill-rule="evenodd" id="Page-1" stroke="none" stroke-width="1">
                  <g fill="var(--color-grey)" id="icon-11-file-html">
                      <path d="M4.99428189,10 C3.34058566,10 2,11.3422643 2,12.9987856 L2,20.0012144 C2,21.6573979 3.3405687,23 4.99428189,23 L28.0057181,23 C29.6594143,23 31,21.6577357 31,20.0012144 L31,12.9987856 C31,11.3426021 29.6594313,10 28.0057181,10 L4.99428189,10 L4.99428189,10 Z M28,19 L28,20 L23,20 L23,13 L24,13 L24,19 L28,19 L28,19 Z M13,14 L13,20 L14,20 L14,14 L16,14 L16,13 L11,13 L11,14 L13,14 L13,14 Z M9,16 L9,13 L10,13 L10,20 L9,20 L9,17 L6,17 L6,20 L5,20 L5,13 L6,13 L6,16 L9,16 L9,16 Z M19.5,16 L18,13 L17.5,13 L17,13 L17,20 L18,20 L18,15 L19,17 L19.5,17 L20,17 L21,15 L21,20 L22,20 L22,13 L21.5,13 L21,13 L19.5,16 L19.5,16 Z" id="file-html" />
                  </g>
              </g>
          </svg>
        </span>
        <span class="screenshot-offline-link" v-else>
<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <title />
    <path d="M19,6H16.41l-1.7-1.71A1,1,0,0,0,14,4H10a1,1,0,0,0-.71.29L7.59,6H5A3,3,0,0,0,2,9v8a3,3,0,0,0,3,3H19a3,3,0,0,0,3-3V9A3,3,0,0,0,19,6ZM12,17a4,4,0,1,1,4-4A4,4,0,0,1,12,17Z" fill="var(--color-grey)" /></svg>
        </span>
        <a v-bind:href="generateHref(file)" target="_blank" rel="noopener">
          {{ isHtmlFile(file) ? 'Offline Article Link' : 'Screenshot Of Article' }}
        </a>
      </div>
    </div>
`,
})

export { PostContentOfflineArticleLink }
