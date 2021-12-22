import * as R from 'ramda'
import * as RA from 'ramda-adjunct'
import * as Vue from 'vue'
import { encaseRes, nullable as MaybeNullable } from 'pratica'
import type { Result } from 'pratica'
import { match } from 'ts-pattern'
import VueVirtualScroller from 'vue-virtual-scroller'
import prettyBytes from 'pretty-bytes'

import type { PostWithMediaDownloadInfo } from '../../../../downloads/media/media-downloads-viewer-organiser'
import type {
  DownloadReadyToBeSent,
  DownloadUpdateData,
} from '../../../../server/controllers/admin/server-side-events'
import { ignoreScriptTagCompilationWarnings } from '../../frontend-utils'
import type { VirtualScrollList } from '../../frontend-global-types'

type PostId = string

type DownloadStatus = 'queued' | 'active' | 'history'

type FrontendDownload = Pick<
  PostWithMediaDownloadInfo,
  | 'id'
  | 'url'
  | 'permalink'
  | 'mediaDownloadTries'
  | 'downloadFailed'
  | 'downloadCancelled'
  | 'downloadCancellationReason'
  | 'downloadSkipped'
  | 'downloadSkippedReason'
  | 'downloadStarted'
  | 'downloadSucceeded'
  | 'downloadProgress'
  | 'downloadSpeed'
  | 'downloadedBytes'
  | 'downloadFileSize'
> & { downloadError: string | null; status: DownloadStatus }

type SSEEvent = Event & { data: string; type: string }

type UpdateProps = {
  status?: DownloadStatus
  mediaDownloadTries?: number
  downloadStarted?: boolean
  downloadFailed?: boolean
  downloadError?: string
  downloadSucceeded?: boolean
  downloadCancelled?: boolean
  downloadCancellationReason?: string
  downloadSkipped?: boolean
  downloadSkippedReason?: string
  downloadFileSize?: number
  downloadedBytes?: number
  downloadSpeed?: number
  downloadProgress?: number
}

type UpdateDownloadPropsParsedData = { type: string; data: DownloadUpdateData }

type DownloadsFromBackend = DownloadReadyToBeSent

/* eslint-disable max-lines-per-function,@typescript-eslint/no-magic-numbers,functional/no-conditional-statement */

const masterListOfDownloads = new Map() as Map<PostId, FrontendDownload>

const state = Vue.reactive({
  activeDownloadsListData: [] as FrontendDownload[],
  downloadHistoryListData: [] as FrontendDownload[],
  queuedDownloadsListData: [] as FrontendDownload[],
  updatesPaused: false,
  isSearchingHistory: false,
  isSearchingQueue: false,
})

Vue.watch(
  () => state.updatesPaused,
  updatesPaused => {
    if (!updatesPaused) {
      const downloads = [...masterListOfDownloads.values()]

      state.activeDownloadsListData = downloads.filter(R.propEq('status', 'active'))
      state.downloadHistoryListData = downloads.filter(R.propEq('status', 'history'))
      state.queuedDownloadsListData = downloads.filter(R.propEq('status', 'queued'))
    }
  }
)

/*****
  We removed empty keys server side to make the payload smaller.
  Now we recreate them.
*****/
const reconstructMinimizedDownloadData = (download: DownloadsFromBackend): FrontendDownload => {
  const downloadStatus = match(download)
    .with({ downloadFailed: true }, () => 'history')
    .with({ downloadCancelled: true }, () => 'history')
    .with({ downloadSkipped: true }, () => 'history')
    .with({ downloadSucceeded: true }, () => 'history')
    /*****
      Make sure this is last pattern as downloadStarted can be true when others above are true
      also, so wouldnt want to match on it before them.
    *****/
    .with({ downloadStarted: true }, () => 'active')
    .otherwise(() => 'queued') as DownloadStatus

  return {
    downloadFailed: false,
    downloadError: null,
    downloadCancelled: false,
    downloadCancellationReason: '',
    downloadSkipped: false,
    downloadSkippedReason: '',
    downloadStarted: false,
    downloadSucceeded: false,
    downloadProgress: 0,
    downloadSpeed: 0,
    downloadedBytes: 0,
    downloadFileSize: 0,
    mediaDownloadTries: 0,
    status: downloadStatus,
    ...download, // we want any existing keys on download to overwrite the defaults we set above.
  }
}

const tryParseSSEData = (data: string): Result<DownloadsFromBackend[] | DownloadUpdateData, unknown> =>
  encaseRes(() => JSON.parse(data) as DownloadsFromBackend[] | DownloadUpdateData)

function replaceDownloadListsData(ev: Event): void {
  const { data } = ev as SSEEvent

  tryParseSSEData(data).cata({
    Ok: (parsedData): void => {
      const downloads = (parsedData as DownloadsFromBackend[]).map(
        reconstructMinimizedDownloadData
      ) as FrontendDownload[]

      console.info(downloads)

      state.activeDownloadsListData = downloads.filter(R.propEq('status', 'active'))
      state.downloadHistoryListData = downloads.filter(R.propEq('status', 'history'))
      state.queuedDownloadsListData = downloads.filter(R.propEq('status', 'queued'))

      masterListOfDownloads.clear()

      downloads.forEach(download => {
        masterListOfDownloads.set(download.id, download)
      })
    },
    Err: err => console.error(err),
  })
}

const createUpdatedDownload = (postId: PostId, updatedDownloadProps: UpdateProps): FrontendDownload => {
  const currentDownload = masterListOfDownloads.get(postId) as FrontendDownload
  return { ...currentDownload, ...updatedDownloadProps }
}

const updateDownloadInMasterList = (postId: PostId, updatedDownload: FrontendDownload): void => {
  masterListOfDownloads.set(postId, updatedDownload)
}

const moveDownloadToOtherList = (
  updatedDownload: FrontendDownload,
  listDataPostCurrentlyResidesIn: FrontendDownload[],
  listDataToMovePostTo: FrontendDownload[]
): void => {
  if (state.updatesPaused) return

  const downloadIndexInListData = listDataPostCurrentlyResidesIn.findIndex(R.propEq('id', updatedDownload.id))

  if (downloadIndexInListData !== -1) {
    // https://mzl.la/3mp0RLT
    // eslint-disable-next-line functional/immutable-data
    listDataPostCurrentlyResidesIn.splice(downloadIndexInListData, 1)
  }

  // eslint-disable-next-line functional/immutable-data
  listDataToMovePostTo.unshift(updatedDownload)
}

function updateDownloadProps(ev: Event): void {
  const { data } = ev as SSEEvent

  tryParseSSEData(data).cata({
    Ok: (parsedData): void => {
      const eventAndData = { data: parsedData, type: ev.type } as UpdateDownloadPropsParsedData

      console.info(eventAndData)

      const { postId } = eventAndData.data
      const downloadFromMasterList = masterListOfDownloads.get(postId) as FrontendDownload

      match(eventAndData)
        .with({ type: 'download-started' }, () => {
          const updatedDownloadProps = {
            status: 'active' as DownloadStatus,
            mediaDownloadTries: downloadFromMasterList.mediaDownloadTries + 1,
            downloadStarted: true,
          }

          const updatedDownload = createUpdatedDownload(postId, updatedDownloadProps)

          updateDownloadInMasterList(postId, updatedDownload)
          moveDownloadToOtherList(updatedDownload, state.queuedDownloadsListData, state.activeDownloadsListData)
        })
        .with({ type: 'download-failed' }, () => {
          const updatedDownloadProps = {
            status: 'history' as DownloadStatus,
            downloadFailed: true,
            downloadError: eventAndData.data.err as string,
          }

          const updatedDownload = createUpdatedDownload(postId, updatedDownloadProps)

          updateDownloadInMasterList(postId, updatedDownload)
          moveDownloadToOtherList(updatedDownload, state.activeDownloadsListData, state.downloadHistoryListData)
        })
        .with({ type: 'download-succeeded' }, () => {
          const updatedDownloadProps = { status: 'history' as DownloadStatus, downloadSucceeded: true }

          const updatedDownload = createUpdatedDownload(postId, updatedDownloadProps)

          updateDownloadInMasterList(postId, updatedDownload)
          moveDownloadToOtherList(updatedDownload, state.activeDownloadsListData, state.downloadHistoryListData)
        })
        .with({ type: 'download-cancelled' }, () => {
          const updatedDownloadProps = {
            status: 'history' as DownloadStatus,
            downloadCancelled: true,
            downloadCancellationReason: eventAndData.data.reason as string,
          }

          const updatedDownload = createUpdatedDownload(postId, updatedDownloadProps)

          updateDownloadInMasterList(postId, updatedDownload)
          moveDownloadToOtherList(updatedDownload, state.activeDownloadsListData, state.downloadHistoryListData)
        })
        .with({ type: 'download-skipped' }, () => {
          const oldDownloadStatus = masterListOfDownloads.get(postId)?.status as DownloadStatus

          const updatedDownloadProps = {
            status: 'history' as DownloadStatus,
            downloadSkipped: true,
            downloadSkippedReason: eventAndData.data.reason as string,
          }

          const updatedDownload = createUpdatedDownload(postId, updatedDownloadProps)

          updateDownloadInMasterList(postId, updatedDownload)

          moveDownloadToOtherList(
            updatedDownload,
            oldDownloadStatus === 'active' ? state.activeDownloadsListData : state.queuedDownloadsListData,
            state.downloadHistoryListData
          )
        })
        .with({ type: 'download-progress' }, () => {
          const updatedDownloadProps = {
            downloadFileSize: eventAndData.data.downloadFileSize as number,
            downloadedBytes: eventAndData.data.downloadedBytes as number,
            downloadSpeed: eventAndData.data.downloadSpeed as number,
            downloadProgress: eventAndData.data.downloadProgress as number,
          }

          const updatedDownload = createUpdatedDownload(postId, updatedDownloadProps)

          updateDownloadInMasterList(postId, updatedDownload)

          const downloadInList = state.activeDownloadsListData.find(R.propEq('id', postId)) as FrontendDownload

          !state.updatesPaused &&
            MaybeNullable(downloadInList).cata({
              // eslint-disable-next-line complexity
              Just: () => {
                downloadInList.downloadFileSize = updatedDownloadProps.downloadFileSize ?? 0
                downloadInList.downloadedBytes = updatedDownloadProps.downloadedBytes ?? 0
                downloadInList.downloadSpeed = updatedDownloadProps.downloadSpeed ?? 0
                downloadInList.downloadProgress = updatedDownloadProps.downloadProgress ?? 0
              },
              Nothing: RA.noop,
            })
        })
        .run()
    },
    Err: err => console.error(err),
  })
}

const evtSource = new EventSource('/admin/api/sse-media-downloads-viewer')

evtSource.addEventListener('page-load', replaceDownloadListsData)
evtSource.addEventListener('new-download-batch-started', replaceDownloadListsData)

evtSource.addEventListener('downloads-cleared', (): void => {
  console.info('downloads-cleared')

  masterListOfDownloads.clear()
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
  },
  computed: {
    pauseButtonText() {
      return state.updatesPaused ? 'Resume Updates' : 'Pause Updated'
    },
  },
  template: /* html */ `
  <button @click="state.updatesPaused = !state.updatesPaused">{{ pauseButtonText }}</button>
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
          <div class="downloadProgress"><span>{{ formatProgress(item.downloadProgress) }}</span></div>
          <div class="size"><span>{{ prettifyBytes(item.downloadedBytes) }} of {{ prettifyBytes(item.downloadFileSize) }}</span></div>
          <div class="downloadSpeed"><span>{{ prettifyBytes(item.downloadSpeed) }}</span></div>
        </div>
      </DynamicScroller>         
    </div>
    <div id="downloads-history-container">
      <h1>Download History</h1>
      <div class="table-columns">
        <div class="table-column-postId"><span>Post Id</span></div>
        <div class="table-column-url"><span>Url</span></div>
        <div class="table-column-size"><span>Size</span></div>
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
  `,
})

const app = Vue.createApp(AdminDownloadsViewer)

// warnHandler is ignored in production https://v3.vuejs.org/api/application-config.html#warnhandler
app.config.warnHandler = ignoreScriptTagCompilationWarnings

app.use(VueVirtualScroller as VirtualScrollList).mount('#downloadListsContainer')

export { FrontendDownload }
