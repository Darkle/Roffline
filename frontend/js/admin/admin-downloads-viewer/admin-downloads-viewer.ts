import * as R from 'ramda'
import * as Vue from 'vue'
import { match } from 'ts-pattern'
import VueVirtualScroller from 'vue-virtual-scroller'
import prettyBytes from 'pretty-bytes'
import JsonViewer from 'vue3-json-viewer'

import { ignoreScriptTagCompilationWarnings } from '../../frontend-utils'
import type { JSONViewer, VirtualScrollList } from '../../frontend-global-types'
import type { FrontendDownload, Filter } from './admin-downloads-viewer.d'
import { state } from './admin-downloads-viewer-state'
import { replaceDownloadListsData, updateDownloadProps } from './admin-downloads-viewer-update-download'

/* eslint-disable @typescript-eslint/no-magic-numbers,max-lines-per-function */

const evtSource = new EventSource('/admin/api/sse-media-downloads-viewer')

evtSource.addEventListener('page-load', replaceDownloadListsData)
evtSource.addEventListener('new-download-batch-started', replaceDownloadListsData)

evtSource.addEventListener('downloads-cleared', (): void => {
  console.info('downloads-cleared')

  state.masterListOfDownloads.clear()
  state.activeDownloadsListData = []
  state.downloadHistoryListData = []
  state.queuedDownloadsListData = []
})

evtSource.addEventListener('download-started', updateDownloadProps)
evtSource.addEventListener('download-failed', updateDownloadProps)
evtSource.addEventListener('download-succeeded', updateDownloadProps)
evtSource.addEventListener('download-cancelled', updateDownloadProps)
evtSource.addEventListener('download-skipped', updateDownloadProps)
evtSource.addEventListener('download-progress', updateDownloadProps)
evtSource.addEventListener('error', err => console.error(err))

window.addEventListener('beforeunload', () => evtSource.close())

const AdminDownloadsViewer = Vue.defineComponent({
  data() {
    return {
      state,
    }
  },
  methods: {
    prettifyBytes(bytes: number | null): string {
      return prettyBytes(typeof bytes === 'number' ? bytes : 0)
    },
    createPostLink(permalink: string): string {
      return `https://www.reddit.com${permalink}`
    },
    formatProgress(progress: number) {
      /*****
       Sometimes we get really low fractions of progress like 0.000006.
       Also, sometimes it is a whole number, so cant call .toFixed on that.
       *****/
      return Number.isInteger(progress)
        ? `${progress * 100}%`
        : `${(Number(progress.toFixed(3)) * 100).toFixed(0)}%`
    },
    functionFormatSize(download: FrontendDownload): string {
      const smallScreen = window.matchMedia('(max-width: 970px)').matches
      const middlePart = smallScreen ? `/` : ` of `

      return `${this.prettifyBytes(download.downloadedBytes)}${middlePart}${this.prettifyBytes(
        download.downloadFileSize
      )}`
    },
    generateDownloadHistoryStatusIcon(download: FrontendDownload): string {
      return (
        match(download)
          .with({ downloadSkipped: true }, () => `⚠️`)
          .with({ downloadCancelled: true }, () => `⛔`)
          .with({ downloadFailed: true }, () => `❌`)
          // this needs to be at the end as its possible to be true with others above also being true
          .with({ downloadSucceeded: true }, () => `✔️`)
          .otherwise(R.always(''))
      )
    },
    generateDownloadHistoryStatusTitle(download: FrontendDownload): string {
      return (
        match(download)
          .with({ downloadSkipped: true }, () => `Download Skipped (click for more info)`)
          .with({ downloadCancelled: true }, () => `Download Cancelled (click for more info)`)
          .with({ downloadFailed: true }, () => `Download Failed (click for more info)`)
          // this needs to be at the end as its possible to be true with others above also being true
          .with({ downloadSucceeded: true }, () => `Download Successful (click for more info)`)
          .otherwise(R.always(''))
      )
    },
    showDownloadHistoryModal(event: Event): void {
      const postId = (event.target as HTMLDivElement).dataset['postId'] as string
      const download = state.masterListOfDownloads.get(postId) as FrontendDownload

      state.jsonViewerData = download
      state.showJSONViewer = true
    },
    historyFilterSelectHandle(event: Event): void {
      const selectElem = event.target as HTMLSelectElement
      const filter = selectElem.value as Filter
      const downloadsHistory = [...state.masterListOfDownloads.values()].filter(R.propEq('status', 'history'))

      state.currentHistoryFilter = filter

      match(state.currentHistoryFilter)
        .with('all', () => {
          state.downloadHistoryListData = downloadsHistory
          state.isFilteringHistory = false
        })
        .with('succeeded', () => {
          state.downloadHistoryListData = downloadsHistory.filter(download =>
            match(download)
              .with(
                {
                  downloadSucceeded: true,
                  downloadSkipped: false,
                  downloadCancelled: false,
                  downloadFailed: false,
                },
                () => true
              )
              .otherwise(R.F)
          )
          state.isFilteringHistory = true
        })
        .with('skipped', () => {
          state.downloadHistoryListData = downloadsHistory.filter(R.propEq('downloadSkipped', true))
          state.isFilteringHistory = true
        })
        .with('cancelled', () => {
          state.downloadHistoryListData = downloadsHistory.filter(R.propEq('downloadCancelled', true))
          state.isFilteringHistory = true
        })
        .with('failed', () => {
          state.downloadHistoryListData = downloadsHistory.filter(R.propEq('downloadFailed', true))
          state.isFilteringHistory = true
        })
        .exhaustive()
    },
  },
  computed: {
    pauseButtonText() {
      return state.updatesPaused ? 'Resume Page Updates' : 'Pause Page Updates'
    },
  },
  template: /* html */ `
    <a id="pause-button" class="button outline" @click.prevent="state.updatesPaused = !state.updatesPaused">{{ pauseButtonText }}</a>
    <div class="search-container">
      <label for="download-history-search">Search All Downloads</label>
      <input type="search" id="download-history-search" aria-label="Search through download history">
    </div>
    <div id="active-downloads-container">
      <h1>Active Downloads</h1>
      <div class="table-columns">
        <div class="table-column-postId"><span>Post Id</span></div>
        <div class="table-column-url"><span>Url</span></div>
        <div class="table-column-progress"><span>Progress</span></div>
        <div class="table-column-size"><span>Size</span></div>
        <div class="table-column-speed"><span>Speed</span></div>
      </div>
      <DynamicScroller
        class="scroller"
        :items="state.activeDownloadsListData"
        :item-size="32"
        :min-item-size="32"
        key-field="id"
        v-slot="{ item }"
        >
        <div class="download-item">
          <div class="postId"><a :href="createPostLink(item.permalink)" target="_blank" rel="noopener noreferrer" title="Click To Open Reddit Post Link For Download">{{ item.id }}</a></div>
          <div class="url"><a :href="item.url" target="_blank" rel="noopener noreferrer" title="Click To Open Download Url">{{ item.url }}</a></div>
          <div class="downloadProgress"><span>{{formatProgress(item.downloadProgress)}}</span></div>
          <div class="size"><span>{{functionFormatSize(item)}}</span></div>
          <div class="downloadSpeed"><span>{{prettifyBytes(item.downloadSpeed)}}</span></div>
        </div>
      </DynamicScroller>         
    </div>
    <div id="downloads-history-container">
      <h1>Download History</h1>
      <div class="download-history-filter">
        <label for="download-history-filterSelect">Filter Download History</label>
        <select 
          name="download-history-filterSelect" 
          id="download-history-filterSelect" 
          @change="historyFilterSelectHandle"
        >
          <option value="all">Show All</option>
          <option value="succeeded">Succeeded ✔️</option>
          <option value="skipped">Skipped ⚠️</option>
          <option value="cancelled">Cancelled ⛔</option>
          <option value="failed">Failed ❌</option>
        </select>     
      </div>
      <div class="table-columns">
        <div class="table-column-postId"><span>Post Id</span></div>
        <div class="table-column-url"><span>Url</span></div>
        <div class="table-column-size"><span>Size</span></div>
        <div class="table-column-status"><span>Status</span></div>
      </div>
      <DynamicScroller
        class="scroller"
        :items="state.downloadHistoryListData"
        :item-size="32"
        :min-item-size="32"
        key-field="id"
        v-slot="{ item }"
        >
        <div class="download-item">
          <div class="postId"><a :href="createPostLink(item.permalink)" target="_blank" rel="noopener noreferrer" title="Click To Open Reddit Post Link For Download">{{ item.id }}</a></div>
          <div class="url"><a :href="item.url" target="_blank" rel="noopener noreferrer" title="Click To Open Download Url">{{ item.url }}</a></div>
          <div class="size"><span>{{ prettifyBytes(item.downloadFileSize) }}</span></div>
          <button class="download-history-status button outline" 
              :data-post-id="item.id" 
              @click="showDownloadHistoryModal">
            <span
              :data-post-id="item.id"
              :title="generateDownloadHistoryStatusTitle(item)">{{ generateDownloadHistoryStatusIcon(item) }}
            </span>
          </button>
        </div>
      </DynamicScroller>      
    </div>
    <div id="download-queue-container">
      <h1>Download Queue</h1>
      <div class="table-columns">
        <div class="table-column-postId"><span>Post Id</span></div>
        <div class="table-column-url"><span>Url</span></div>
        <div class="table-column-downloadTries"><span>Download Tries</span></div>
      </div>
      <DynamicScroller
        class="scroller"
        :items="state.queuedDownloadsListData"
        :item-size="32"
        :min-item-size="32"
        key-field="id"
        v-slot="{ item }"
        >
        <div class="download-item">
          <div class="postId"><a :href="createPostLink(item.permalink)" target="_blank" rel="noopener noreferrer" title="Click To Open Reddit Post Link For Download">{{ item.id }}</a></div>
          <div class="url"><a :href="item.url" target="_blank" rel="noopener noreferrer" title="Click To Open Download Url">{{ item.url }}</a></div>
          <div class="downloadTries"><span>{{ item.mediaDownloadTries }}</span></div>
        </div>
      </DynamicScroller>
    </div>
    <div class="json-object-view-wrapper" v-if="state.showJSONViewer">
      <div class="close-button" @click="state.showJSONViewer = false">✕</div>
      <json-viewer :value="state.jsonViewerData" />
    </div>    
  `,
})

const app = Vue.createApp(AdminDownloadsViewer)

// warnHandler is ignored in production https://v3.vuejs.org/api/application-config.html#warnhandler
app.config.warnHandler = ignoreScriptTagCompilationWarnings

app
  .use(VueVirtualScroller as VirtualScrollList)
  .use(JsonViewer as JSONViewer)
  .mount('#downloadListsContainer')

export { FrontendDownload }
