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
    const emblaInnerContainer = this.$refs[`embla-gallery-for-${postId}`] as HTMLElement

    /*****
      For some reason calling EmblaCarousel straight up on mounted doesnt work. I guess something
        isn't ready yet? Calling this.$nextTick doesnt seem to be enough time either, so using
        requestIdleCallback if avail or setTimeout.
    *****/

    const halfASecond = 500

    // eslint-disable-next-line functional/no-conditional-statement
    if (requestIdleCallback) {
      requestIdleCallback(() => {
        EmblaCarousel(emblaInnerContainer, { loop: false })
      })
    } else {
      setTimeout(() => {
        EmblaCarousel(emblaInnerContainer, { loop: false })
      }, halfASecond)
    }
  },
  computed: {
    innerContainerClass(): string {
      const postId = this.post?.id as string
      return `embla image-gallery gallery-postid-${postId}`
    },
    elemRef(): string {
      const postId = this.post?.id as string
      return `embla-gallery-for-${postId}`
    },
  },
  template: /* html */ `
    <div class="gallery-container">
      <div v-bind:class="innerContainerClass" v-bind:ref="elemRef">
        <div class="embla__container">
          <div class="embla__slide" v-for="(file, index) in post.downloadedFiles" :key="file">
            <img v-bind:alt="generateImageAlt(index)" v-bind:src="generateImageSrc(file)" />
          </div>
        </div>
      </div>
      <span class="gallery-icon" title="Swipe left/right to view gallery">⇄</span>  
    </div>
`,
})

export { PostContentImageGallery }
