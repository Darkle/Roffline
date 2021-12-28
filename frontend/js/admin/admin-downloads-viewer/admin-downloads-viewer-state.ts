import * as R from 'ramda'
import * as Vue from 'vue'
import { $ } from '../../frontend-utils'
import type { FrontendDownload, Filter, PostId } from './admin-downloads-viewer.d'

/* eslint-disable functional/no-conditional-statement */

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
  masterListOfDownloads: new Map<PostId, FrontendDownload>(),
})

Vue.watch(
  () => state.updatesPaused,
  updatesPaused => {
    if (!updatesPaused) {
      const downloads = [...state.masterListOfDownloads.values()]

      state.activeDownloadsListData = downloads.filter(R.propEq('status', 'active'))
      state.downloadHistoryListData = downloads.filter(R.propEq('status', 'history'))
      state.queuedDownloadsListData = downloads.filter(R.propEq('status', 'queued'))

      state.isFilteringHistory = false
      state.currentHistoryFilter = 'all'
      state.isSearching = false
      state.searchTerm = ''

      const searchInput = $('#download-history-search') as HTMLInputElement
      // eslint-disable-next-line functional/immutable-data
      searchInput.value = ''
    }
  }
)

Vue.watch(
  () => state.isSearching,
  isSearching => {
    if (isSearching) {
      // We want to reset filter when searching cause wont want filter when searching for something specific.
      state.isFilteringHistory = false
      state.currentHistoryFilter = 'all'
    }
  }
)

function resetDownloadsAfterStopSearching(): void {
  const downloads = [...state.masterListOfDownloads.values()]

  state.activeDownloadsListData = downloads.filter(R.propEq('status', 'active'))
  state.downloadHistoryListData = downloads.filter(R.propEq('status', 'history'))
  state.queuedDownloadsListData = downloads.filter(R.propEq('status', 'queued'))
}

Vue.watch(
  () => state.searchTerm,
  searchTerm => {
    if (searchTerm.length > 0) {
      state.isSearching = true
    } else {
      state.isSearching = false

      resetDownloadsAfterStopSearching()
    }
  }
)

export { state }
