import * as Vue from 'vue'

const PostContentVideo = Vue.defineComponent({
  props: {
    id: String,
    downloadedFiles: Array as Vue.PropType<string[]>,
    volume: Number,
  },
  computed: {
    videoSrc(): string {
      const postId = this.id as string
      const downloadedFiles = this.downloadedFiles as string[]
      const videoFile = downloadedFiles[0] as string

      return `/posts-media/${postId}/${encodeURIComponent(videoFile)}`
    },
  },
  emits: ['updateVolume'],
  methods: {
    updateVolume(): void {
      const postId = this.id as string
      const videoElement = this.$refs[`video-for-${postId}`] as HTMLVideoElement
      this.$emit('updateVolume', videoElement.volume)
    },
    setThisElemVolumeOnPlay(): void {
      const postId = this.id as string
      const videoElement = this.$refs[`video-for-${postId}`] as HTMLVideoElement
      // eslint-disable-next-line functional/immutable-data
      videoElement.volume = this.volume as number
    },
  },
  template: /* html */ `
  <video 
    @volumechange="updateVolume"
    @play="setThisElemVolumeOnPlay"
    class="'video-postid-' + postId" 
    preload="auto" 
    controls 
    v-bind:ref="'video-for-' + id"
    src="videoSrc">
  </video>
`,
})

export { PostContentVideo }
