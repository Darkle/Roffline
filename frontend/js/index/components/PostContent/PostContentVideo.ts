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
  },
  methods: {
    safeEncodeURIComponent(str: string | undefined): string {
      return encodeURIComponent(str || '')
    },
    updateVolume(event: Event): void {
      const videoElement = event.target as HTMLVideoElement
      window.globalVolumeStore.updateVolume(videoElement.volume)
    },
    setThisElemVolumeOnPlay(event: Event): void {
      const videoElement = event.target as HTMLVideoElement
      // eslint-disable-next-line functional/immutable-data
      videoElement.volume = window.globalVolumeStore.getVolume()
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
    v-bind:src="videoSrc">
  </video>
`,
})

export { PostContentVideo }
