import * as R from 'ramda'
import * as Vue from 'vue'
import type { FrontendDownload, Filter, PostId } from './admin-downloads-viewer.d'

const state = Vue.reactive({
  activeDownloadsListData: [] as FrontendDownload[],
  downloadHistoryListData: [] as FrontendDownload[],
  queuedDownloadsListData: [] as FrontendDownload[],
  updatesPaused: false,
  isSearching: false,
  searchTerm: '',
  isFilteringHistory: false,
  currentHistoryFilter: 'all' as Filter,
  showJSONViewer: false,
  jsonViewerData: null as null | FrontendDownload,
  masterListOfDownloads: new Map() as Map<PostId, FrontendDownload>,
})

Vue.watch(
  () => state.updatesPaused,
  updatesPaused => {
    // eslint-disable-next-line functional/no-conditional-statement
    if (!updatesPaused) {
      const downloads = [...state.masterListOfDownloads.values()]

      state.activeDownloadsListData = downloads.filter(R.propEq('status', 'active'))
      state.downloadHistoryListData = downloads.filter(R.propEq('status', 'history'))
      state.queuedDownloadsListData = downloads.filter(R.propEq('status', 'queued'))
    }
  }
)

export { state }
