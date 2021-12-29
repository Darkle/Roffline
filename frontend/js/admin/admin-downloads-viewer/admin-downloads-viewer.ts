import * as R from 'ramda'
import * as Vue from 'vue'
import { match } from 'ts-pattern'
import VueVirtualScroller from 'vue-virtual-scroller'
import prettyBytes from 'pretty-bytes'
import JsonViewer from 'vue3-json-viewer'
import debounce from 'lodash.debounce'
import ContextMenu from '@imengyu/vue3-context-menu'

import { $, Fetcher } from '../../frontend-utils'
import type { JSONViewer, VirtualScrollList } from '../../frontend-global-types'
import type { FrontendDownload, Filter } from './admin-downloads-viewer.d'
import { state } from './admin-downloads-viewer-state'
import {
  replaceDownloadListsData,
  updateDownloadProps,
  downloadMatchesSearch,
  downloadHasNo404Error,
} from './admin-downloads-viewer-update-download'

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
  created() {
    const delay = 500
    // eslint-disable-next-line functional/immutable-data
    this['onSearch'] = debounce((ev: Event) => {
      const inputElem = ev.target as HTMLInputElement
      state.searchTerm = inputElem.value.trim().toLowerCase()

      const downloads = [...state.masterListOfDownloads.values()]

      state.activeDownloadsListData = downloads.filter(R.propEq('status', 'active')).filter(downloadMatchesSearch)
      state.downloadHistoryListData = downloads
        .filter(R.propEq('status', 'history'))
        .filter(downloadMatchesSearch)
      state.queuedDownloadsListData = downloads.filter(R.propEq('status', 'queued')).filter(downloadMatchesSearch)
    }, delay)
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
          // It's possible for downloadSucceeded to be true when others are true as well, so check others arent true too.
          .with(
            {
              downloadSucceeded: true,
              downloadSkipped: false,
              downloadCancelled: false,
              downloadFailed: false,
            },
            () => `✔️`
          )
          .otherwise(R.always(''))
      )
    },
    generateDownloadHistoryStatusTitle(download: FrontendDownload): string {
      return (
        match(download)
          .with({ downloadSkipped: true }, () => `Download Skipped (click for more info)`)
          .with({ downloadCancelled: true }, () => `Download Cancelled (click for more info)`)
          .with({ downloadFailed: true }, () => `Download Failed (click for more info)`)
          // It's possible for downloadSucceeded to be true when others are true as well, so check others arent true too.
          .with(
            {
              downloadSucceeded: true,
              downloadSkipped: false,
              downloadCancelled: false,
              downloadFailed: false,
            },
            () => `Download Successful (click for more info)`
          )
          .otherwise(R.always(''))
      )
    },
    showDownloadHistoryModal(event: Event): void {
      const postId = (event.target as HTMLDivElement).dataset['postId'] as string
      const download = state.masterListOfDownloads.get(postId) as FrontendDownload

      state.jsonViewerData = download
      state.showJSONViewer = true

      this.$nextTick(() => {
        const historyListElem = $('#downloads-history-container') as HTMLDivElement
        const jsonObjectViewerElem = $('.json-object-view-wrapper') as HTMLDivElement

        // eslint-disable-next-line functional/immutable-data
        jsonObjectViewerElem.style.top = `${historyListElem.offsetTop}px`
      })
    },
    historyFilterSelectHandle(event: Event): void {
      const selectElem = event.target as HTMLSelectElement
      const filter = selectElem.value as Filter
      const downloadsHistory = [...state.masterListOfDownloads.values()].filter(R.propEq('status', 'history'))

      state.currentHistoryFilter = filter
      state.isFilteringHistory = state.currentHistoryFilter !== 'all'

      const remove404Failures = downloadHasNo404Error

      state.downloadHistoryListData = match(state.currentHistoryFilter)
        .with('all', () => downloadsHistory)
        .with('succeeded', () =>
          downloadsHistory.filter(download =>
            match(download)
              .with(
                // It's possible for downloadSucceeded to be true when others are true as well, so check others arent true too.
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
        )
        .with('skipped', () => downloadsHistory.filter(R.propEq('downloadSkipped', true)))
        .with('cancelled', () => downloadsHistory.filter(R.propEq('downloadCancelled', true)))
        .with('failed', () => downloadsHistory.filter(R.propEq('downloadFailed', true)))
        .with('failed-no-404', () =>
          downloadsHistory.filter(R.propEq('downloadFailed', true)).filter(remove404Failures)
        )
        .exhaustive()
    },
    onContextMenu(event: MouseEvent, postId: string) {
      this.$contextmenu({
        x: event.x,
        y: event.y,
        items: [
          {
            label: `Cancel Download: ${postId}`,
            onClick: (): void => {
              console.log('Cancelling download:', postId)
              Fetcher.putJSON(`/admin/api/cancel-download`, { downloadToCancel: postId }).catch(err =>
                console.error(err)
              )
            },
          },
        ],
      })
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
      <input type="search" id="download-history-search" @input="onSearch" aria-label="Search all downloads">
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
        <div class="download-item" @contextmenu.prevent="onContextMenu($event, item.id)">
          <div class="postId"><a :href="createPostLink(item.permalink)" target="_blank" rel="noopener noreferrer" title="Click To Open Reddit Post Link For Download">{{ item.id }}</a></div>
          <div class="url"><a :href="item.url" target="_blank" rel="noopener noreferrer" title="Click To Open Download Url">{{ item.url }}</a></div>
          <div class="downloadProgress"><span>{{formatProgress(item.downloadProgress)}}</span></div>
          <div class="size"><span>{{functionFormatSize(item)}}</span></div>
          <div class="downloadSpeed"><span>{{prettifyBytes(item.downloadSpeed)}}</span></div>
        </div>
      </DynamicScroller>    
      <aside>
        <small>Note: If a download stalls, you can right-click and cancel the download.</small>
      </aside>     
    </div>
    <div id="downloads-history-container">
      <h1>Download History</h1>
      <div class="download-history-filter">
        <label for="download-history-filterSelect">Filter Download History</label>
        <select 
          name="download-history-filterSelect" 
          id="download-history-filterSelect" 
          @change="historyFilterSelectHandle"
          v-model="state.currentHistoryFilter"
        >
          <option value="all">Show All</option>
          <option value="succeeded">Succeeded ✔️</option>
          <option value="skipped">Skipped ⚠️</option>
          <option value="cancelled">Cancelled ⛔</option>
          <option value="failed">Failed ❌</option>
          <option value="failed-no-404">Failed ❌ (sans 404s)</option>
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
      <aside>
        <small>Note: You can click on the status to see why a download failed/skipped/etc.</small>
      </aside>     
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

app
  .use(VueVirtualScroller as VirtualScrollList)
  .use(JsonViewer as JSONViewer)
  .use(ContextMenu)
  .mount('#downloadListsContainer')

export { FrontendDownload }
