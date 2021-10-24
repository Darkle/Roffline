import * as Vue from 'vue'
import { unescape } from 'html-escaper'

import { FrontendPost } from '../../frontend-global-types'

const PostContentSingleImage = Vue.defineComponent({
  props: {
    post: Object as Vue.PropType<FrontendPost>,
  },
  methods: {
    safeEncodeURIComponent(str: string | undefined): string {
      return encodeURIComponent(str || '')
    },
  },
  computed: {
    imageSrc(): string {
      const postId = this.post?.id as string
      const downloadedFiles = this.post?.downloadedFiles as string[]
      const imageFile = downloadedFiles[0]

      return `/posts-media/${postId}/${this.safeEncodeURIComponent(imageFile)}`
    },
    imageAlt(): string {
      const title = this.post?.title as string
      // unescape to convert &amp; to &. Eg https://api.reddit.com/api/info/?id=t3_qaolx9
      return `Image for the post: ${unescape(title)}`
    },
  },
  template: /* html */ `
    <div class="single-image">
      <img loading=lazy v-bind:alt="imageAlt" v-bind:src="imageSrc"/>
    </div>
`,
})

export { PostContentSingleImage }
