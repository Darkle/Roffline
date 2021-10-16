import * as Vue from 'vue'
import EmblaCarousel from 'embla-carousel'

import { FrontendPost } from '../../../frontend-global-types'

const PostContentImageGallery = Vue.defineComponent({
  props: {
    post: Object as Vue.PropType<FrontendPost>,
  },
  methods: {
    generateImageAlt(index: number): string {
      const title = this.post?.title as string
      return `Image ${index + 1} for the post: ${title}`
    },
    safeEncodeURIComponent(str: string | undefined): string {
      return encodeURIComponent(str || '')
    },
    generateImageSrc(file: string): string {
      const postId = this.post?.id as string
      return `/posts-media/${postId}/${this.safeEncodeURIComponent(file)}`
    },
  },
  mounted() {
    const postId = this.post?.id as string
    const galleryElement = this.$refs[`embla-gallery-for-${postId}`] as HTMLElement

    EmblaCarousel(galleryElement, { loop: false })
  },
  template: /* html */ `
    <div class="gallery-container">
      <div class="'embla image-gallery gallery-postid-' + id" v-bind:ref="'embla-gallery-for-' + id">
        <div class="embla__container">
          <div class="embla__slide" v-for="(file, index) in post.downloadedFiles">
            <img alt="generateImageAlt(index)" src="generateImageSrc(file)" />
          </div>
        </div>
      </div>
      <span class="gallery-icon" title="Swipe left/right to view gallery">⇄</span>  
    </div>
`,
})

export { PostContentImageGallery }
