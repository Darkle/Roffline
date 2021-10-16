import * as Vue from 'vue'

import { FrontendPost } from '../../../frontend-global-types'

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
  },
  template: /* html */ `
    <div class="single-image">
      <img loading=lazy v-bind:alt="'Image for the post: ' post.title" v-bind:src="imageSrc"/>
    </div>
`,
})

export { PostContentSingleImage }
