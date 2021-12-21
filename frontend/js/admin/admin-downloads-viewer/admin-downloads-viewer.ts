import * as Vue from 'vue'
import { encaseRes } from 'pratica'
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

/* eslint-disable max-lines-per-function */

const masterListOfDownloads = new Map() as Map<PostId, FrontendDownload>

const state = Vue.reactive({
  activeDownloadsListData: [] as FrontendDownload[],
  downloadHistoryListData: [] as FrontendDownload[],
  queuedDownloadsListData: [] as FrontendDownload[],
})

/*****
  We removed empty keys server side to make the payload smaller.
  Now we recreate them.
*****/
const reconstructMinimizedDownloadData = (download: DownloadReadyToBeSent): FrontendDownload => {
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
    status: downloadStatus,
    ...download, // we want any existing keys on download to overwrite the defaults we set above.
  }
}

const tryParseSSEData = (data: string): Result<DownloadReadyToBeSent[] | DownloadUpdateData, unknown> =>
  encaseRes(() => JSON.parse(data) as DownloadReadyToBeSent[] | DownloadUpdateData)

function replaceDownloadListsData(ev: Event): void {
  const { data } = ev as SSEEvent

  tryParseSSEData(data).cata({
    Ok: (parsedData): void => {
      const downloads = (parsedData as DownloadReadyToBeSent[]).map(
        reconstructMinimizedDownloadData
      ) as FrontendDownload[]

      console.info(downloads)

      state.activeDownloadsListData = downloads.filter(download => download.status === 'active')
      state.downloadHistoryListData = downloads.filter(download => download.status === 'history')
      state.queuedDownloadsListData = downloads.filter(download => download.status === 'queued')

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
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/splice#remove_1_element_at_index_3
  // eslint-disable-next-line functional/immutable-data
  listDataPostCurrentlyResidesIn.splice(
    listDataPostCurrentlyResidesIn.findIndex(download => download.id === updatedDownload.id),
    1
  )

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
        // eslint-disable-next-line complexity
        .with({ type: 'download-progress' }, () => {
          const updatedDownloadProps = {
            downloadFileSize: eventAndData.data.downloadFileSize as number,
            downloadedBytes: eventAndData.data.downloadedBytes as number,
            downloadSpeed: eventAndData.data.downloadSpeed as number,
            downloadProgress: eventAndData.data.downloadProgress as number,
          }

          const updatedDownload = createUpdatedDownload(postId, updatedDownloadProps)

          updateDownloadInMasterList(postId, updatedDownload)

          const downloadInList = state.activeDownloadsListData.find(
            download => download.id === postId
          ) as FrontendDownload

          downloadInList.downloadFileSize = updatedDownloadProps.downloadFileSize ?? 0
          downloadInList.downloadedBytes = updatedDownloadProps.downloadedBytes ?? 0
          downloadInList.downloadSpeed = updatedDownloadProps.downloadSpeed ?? 0
          downloadInList.downloadProgress = updatedDownloadProps.downloadProgress ?? 0
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
  },
  template: /* html */ `
    <div id="active-downloads-container">
      <DynamicScroller
        class="scroller"
        :items="state.activeDownloadsListData"
        :item-size="32"
        :min-item-size="32"
        key-field="id"
        v-slot="{ item }"
        >
        <div class="download-item">
          <div class="postId"><a :href="createPostLink(item.permalink)" target="_blank" rel="noopener noreferrer" title="Click To Open Reddit Post Link For Download">Post id: {{ item.id }}</a></div>
          <div class="url">{{ item.url }}</div>
          <div class="downloadProgress">Progress: {{ item.downloadProgress }}</div>
          <div class="size">Size: {{ prettifyBytes(item.downloadedBytes) }} of {{ prettifyBytes(item.downloadFileSize) }}</div>
          <div class="downloadSpeed">Speed: {{ prettifyBytes(item.downloadSpeed) }}</div>
        </div>
      </DynamicScroller>         
    </div>
    <div id="downloads-history-container">
      <DynamicScroller
        class="scroller"
        :items="state.downloadHistoryListData"
        :item-size="32"
        :min-item-size="32"
        key-field="id"
        v-slot="{ item }"
        >
        <div class="download-item">
          <div class="postId"><a :href="createPostLink(item.permalink)" target="_blank" rel="noopener noreferrer" title="Click To Open Reddit Post Link For Download">Post id: {{ item.id }}</a></div>
          <div class="url">{{ item.url }}</div>
          <div class="size">Size: {{ prettifyBytes(item.downloadFileSize) }}</div>
        </div>
      </DynamicScroller>      
    </div>
    <div id="download-queue-container">
      <DynamicScroller
        class="scroller"
        :items="state.queuedDownloadsListData"
        :item-size="32"
        :min-item-size="32"
        key-field="id"
        v-slot="{ item }"
        >
        <div class="download-item">
          <div class="postId"><a :href="createPostLink(item.permalink)" target="_blank" rel="noopener noreferrer" title="Click To Open Reddit Post Link For Download">Post id: {{ item.id }}</a></div>
          <div class="url">{{ item.url }}</div>
        </div>
      </DynamicScroller>
    </div>
  `,
})

const app = Vue.createApp(AdminDownloadsViewer)

// warnHandler is ignored in production https://v3.vuejs.org/api/application-config.html#warnhandler
app.config.warnHandler = ignoreScriptTagCompilationWarnings

app.use(VueVirtualScroller as VirtualScrollList).mount('#downloadTablesContainer')

export { FrontendDownload }
