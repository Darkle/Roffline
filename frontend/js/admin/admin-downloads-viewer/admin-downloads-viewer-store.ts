import * as Vue from 'vue'

import type { FrontendDownload } from './admin-downloads-viewer'

const state = Vue.reactive({
  downloads: [] as FrontendDownload[],
})

export { state }
