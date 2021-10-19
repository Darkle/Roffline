import * as Vue from 'vue'
import { unescape } from 'html-escaper'

import { FrontendPost } from '../../../frontend-global-types'

const PostContentImageGallery = Vue.defineComponent({
  props: {
    post: Object as Vue.PropType<FrontendPost>,
  },
  methods: {
    generateImageAlt(index: number): string {
      const title = this.post?.title as string
      // unescape to convert &amp; to &. Eg https://api.reddit.com/api/info/?id=t3_qaolx9
      return `Image ${index + 1} for the post: ${unescape(title)}`
    },
    safeEncodeURIComponent(str: string | undefined): string {
      return encodeURIComponent(str || '')
    },
    generateImageSrc(file: string): string {
      const postId = this.post?.id as string
      return `/posts-media/${postId}/${this.safeEncodeURIComponent(file)}`
    },
  },
  template: /* html */ `
    <div class="gallery-container">
      <Splide :options="{ pagination: false }">
        <SplideSlide v-for="(file, index) in post.downloadedFiles" :key="file">
          <img v-bind:alt="generateImageAlt(index)" v-bind:src="generateImageSrc(file)" />
        </SplideSlide>
      </Splide>
    </div>
  `,
})

export { PostContentImageGallery }
