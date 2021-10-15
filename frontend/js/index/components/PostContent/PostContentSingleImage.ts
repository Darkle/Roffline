import * as Vue from 'vue'

const safeEncodeURIComponent = (str: string | undefined): string => encodeURIComponent(str || '')

const PostContentSingleImage = Vue.defineComponent({
  props: {
    id: String,
    title: String,
    downloadedFiles: Array as Vue.PropType<string[]>,
  },
  computed: {
    imageSrc(): string {
      const postId = this.id as string
      const downloadedFiles = this.downloadedFiles as string[]
      const imageFile = downloadedFiles[0]

      return `/posts-media/${postId}/${safeEncodeURIComponent(imageFile)}`
    },
  },
  template: /* html */ `
    <div class="single-image">
      <img loading=lazy v-bind:alt="'Image for the post: ' title" v-bind:src="imageSrc"/>
    </div>
`,
})

export { PostContentSingleImage }
