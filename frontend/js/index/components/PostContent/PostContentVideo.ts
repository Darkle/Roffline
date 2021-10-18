import * as Vue from 'vue'

import { FrontendPost, WindowWithProps } from '../../../frontend-global-types'

declare const window: WindowWithProps

const PostContentVideo = Vue.defineComponent({
  props: {
    post: Object as Vue.PropType<FrontendPost>,
  },
  computed: {
    videoSrc(): string {
      const postId = this.post?.id as string
      const downloadedFiles = this.post?.downloadedFiles as string[]
      const videoFile = downloadedFiles[0] as string

      return `/posts-media/${postId}/${this.safeEncodeURIComponent(videoFile)}`
    },
    videoRef(): string {
      const postId = this.post?.id as string
      return `video-postid-${postId}`
    },
  },
  methods: {
    safeEncodeURIComponent(str: string | undefined): string {
      return encodeURIComponent(str || '')
    },
    updateVolume(event: Event): void {
      const videoElement = event.target as HTMLVideoElement
      const volume = videoElement.muted ? 0 : videoElement.volume

      window.globalVolumeStore.updateVolume(volume)
    },
    setThisElemVolumeOnPlay(event: Event): void {
      const videoElement = event.target as HTMLVideoElement

      videoElement.volume = window.globalVolumeStore.getVolume()
    },
  },
  mounted() {
    const postId = this.post?.id as string
    const videoElement = this.$refs[`video-postid-${postId}`] as HTMLVideoElement

    videoElement.volume = window.globalVolumeStore.getVolume()
  },
  template: /* html */ `
  <video 
    @volumechange="updateVolume"
    @play="setThisElemVolumeOnPlay"
    v-bind:class="'video-postid-' + post.id" 
    v-bind:ref="videoRef" 
    preload="auto" 
    controls 
    v-bind:src="videoSrc">
  </video>
`,
})

export { PostContentVideo }
