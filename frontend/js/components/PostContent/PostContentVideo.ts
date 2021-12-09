import * as Vue from 'vue'

import type { FrontendPost } from '../../frontend-global-types'

const getLocallyStoredVolumeSetting = (): number => {
  const storedVolume = localStorage.getItem('volume')
  // Volume is between 0 and 1. 1 being 100%.
  return storedVolume ? Number(storedVolume) : 1
}

const getLocallyStoredMuteSetting = (): boolean => {
  const storedMuted = localStorage.getItem('muted')
  return storedMuted === 'true'
}

const volume = Vue.ref(getLocallyStoredVolumeSetting())
const muted = Vue.ref(getLocallyStoredMuteSetting())

const PostContentVideo = Vue.defineComponent({
  props: {
    post: Object as Vue.PropType<FrontendPost>,
  },
  data() {
    return { volume, muted }
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

      muted.value = videoElement.muted
      localStorage.setItem('muted', videoElement.muted.toString())

      // eslint-disable-next-line functional/no-conditional-statement
      if (!videoElement.muted) {
        volume.value = videoElement.volume
        localStorage.setItem('volume', videoElement.volume.toString())
      }
    },
  },
  template: /* html */ `
  <video 
    @volumechange="updateVolume"
    v-bind:class="'video-postid-' + post.id" 
    v-bind:volume="volume" 
    v-bind:muted="muted" 
    preload="auto" 
    controls 
    v-bind:src="videoSrc">
  </video>
`,
})

export { PostContentVideo }
