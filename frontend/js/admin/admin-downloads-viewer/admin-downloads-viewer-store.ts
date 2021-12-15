import * as Vue from 'vue'
import type { Tabulator } from 'tabulator-tables'

import type { Download } from './admin-downloads-viewer'

const state = Vue.reactive({
  table: null as null | Tabulator,
  downloads: [] as Download[],
})

export { state }
