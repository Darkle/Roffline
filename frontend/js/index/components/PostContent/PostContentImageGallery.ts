import * as Vue from 'vue'
import EmblaCarousel from 'embla-carousel'

const PostContentImageGallery = Vue.defineComponent({
  props: {
    id: String,
    title: String,
    downloadedFiles: Array as Vue.PropType<string[]>,
  },
  methods: {
    generateImageAlt(index: number): string {
      const title = this.title as string
      return `Image ${index + 1} for the post: ${title}`
    },
    generateImageSrc(file: string): string {
      const postId = this.id as string
      return `/posts-media/${postId}/${encodeURIComponent(file)}`
    },
  },
  mounted() {
    const postId = this.id as string
    const galleryElement = this.$refs[`embla-gallery-for-${postId}`] as HTMLElement

    EmblaCarousel(galleryElement, { loop: false })
  },
  template: /* html */ `
    <div class="gallery-container">
      <div class="'embla image-gallery gallery-postid-' + id" v-bind:ref="'embla-gallery-for-' + id">
        <div class="embla__container">
          <div class="embla__slide" v-for="(file, index) in downloadedFiles">
            <img alt="generateImageAlt(index)" src="generateImageSrc(file)" />
          </div>
        </div>
      </div>
      <span class="gallery-icon" title="Swipe left/right to view gallery">⇄</span>  
    </div>
`,
})

export { PostContentImageGallery }
