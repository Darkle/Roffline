import * as Vue from 'vue'
import { encaseRes } from 'pratica'
import { match } from 'ts-pattern'
import VScrollGrid from 'vue-virtual-scroll-grid'

// import { tableColumns } from './table-columns'
import type { PostWithMediaDownloadInfo } from '../../../../downloads/media/media-downloads-viewer-organiser'
import type {
  DownloadReadyToBeSent,
  DownloadUpdateData,
} from '../../../../server/controllers/admin/server-side-events'
import { ignoreScriptTagCompilationWarnings } from '../../frontend-utils'

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

/* eslint-disable max-lines-per-function */

const masterListOfDownloads = new Map() as Map<PostId, FrontendDownload>

const state = Vue.reactive({
  activeDownloadsTableData: [] as FrontendDownload[],
  downloadHistoryTableData: [] as FrontendDownload[],
  queuedDownloadsTableData: [] as FrontendDownload[],
})

/*****
  We removed empty keys server side to make the payload smaller.
  Now we recreate them.
*****/
const reconstructMinimizedDownloadData = (download: DownloadReadyToBeSent): FrontendDownload => ({
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
  status: 'queued',
  ...download,
})

function replaceTableData(ev: Event): void {
  const { data } = ev as SSEEvent

  encaseRes(() => JSON.parse(data) as DownloadReadyToBeSent[]).cata({
    Ok: (parsedData): void => {
      const downloads = parsedData?.map(reconstructMinimizedDownloadData) as FrontendDownload[]
      state.activeDownloadsTableData = []
      state.downloadHistoryTableData = []
      state.queuedDownloadsTableData = downloads
      //TODO: add the data to the masterListOfDownloads here

      console.info(downloads)
    },
    Err: msg => console.error(msg),
  })
}

type UpdateDownloadPropsParsedData = { type: string; data: DownloadUpdateData }

const createUpdatedDownload = (postId: PostId, updatedDownloadProps: UpdateProps): FrontendDownload => {
  const currentDownload = masterListOfDownloads.get(postId) as FrontendDownload
  return { ...currentDownload, ...updatedDownloadProps }
}

function updateDownloadProps(ev: Event): void {
  const { data } = ev as SSEEvent

  encaseRes(() => JSON.parse(data) as UpdateDownloadPropsParsedData).cata({
    Ok: (parsedData): void => {
      const eventAndData = parsedData as UpdateDownloadPropsParsedData
      console.log(eventAndData.type)
      console.dir(eventAndData)

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

          masterListOfDownloads.set(postId, updatedDownload)

          //Remove from queuedDownloadsTableData https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/splice#remove_1_element_at_index_3
          state.queuedDownloadsTableData.splice(
            state.queuedDownloadsTableData.findIndex(download => download.id === postId),
            1
          )

          state.activeDownloadsTableData.unshift(updatedDownload)
        })
        .with({ type: 'download-failed' }, () => {
          const updatedDownloadProps = {
            status: 'history' as DownloadStatus,
            downloadFailed: true,
            downloadError: eventAndData.data.err as string,
          }

          const updatedDownload = createUpdatedDownload(postId, updatedDownloadProps)

          masterListOfDownloads.set(postId, updatedDownload)

          state.activeDownloadsTableData.splice(
            state.activeDownloadsTableData.findIndex(download => download.id === postId),
            1
          )

          state.downloadHistoryTableData.unshift(updatedDownload)
        })
        .with({ type: 'download-succeeded' }, () => {
          const updatedDownloadProps = { status: 'history' as DownloadStatus, downloadSucceeded: true }

          const updatedDownload = createUpdatedDownload(postId, updatedDownloadProps)

          masterListOfDownloads.set(postId, updatedDownload)

          state.activeDownloadsTableData.splice(
            state.activeDownloadsTableData.findIndex(download => download.id === postId),
            1
          )

          state.downloadHistoryTableData.unshift(updatedDownload)
        })
        .with({ type: 'download-cancelled' }, () => {
          const updatedDownloadProps = {
            status: 'history' as DownloadStatus,
            downloadCancelled: true,
            downloadCancellationReason: eventAndData.data.reason as string,
          }

          const updatedDownload = createUpdatedDownload(postId, updatedDownloadProps)

          masterListOfDownloads.set(postId, updatedDownload)

          state.activeDownloadsTableData.splice(
            state.activeDownloadsTableData.findIndex(download => download.id === postId),
            1
          )

          state.downloadHistoryTableData.unshift(updatedDownload)
        })
        .with({ type: 'download-skipped' }, () => {
          const updatedDownloadProps = {
            status: 'history' as DownloadStatus,
            downloadSkipped: true,
            downloadSkippedReason: eventAndData.data.reason as string,
          }

          const updatedDownload = createUpdatedDownload(postId, updatedDownloadProps)

          masterListOfDownloads.set(postId, updatedDownload)

          const postFromActiveDownloads = state.activeDownloadsTableData.find(download => download.id === postId)

          // eslint-disable-next-line functional/no-conditional-statement
          if (postFromActiveDownloads) {
            state.activeDownloadsTableData.splice(
              state.activeDownloadsTableData.findIndex(dload => dload.id === postId),
              1
            )
          }

          const postFromQueuedDownloads = state.queuedDownloadsTableData.find(download => download.id === postId)

          // eslint-disable-next-line functional/no-conditional-statement
          if (postFromQueuedDownloads) {
            state.queuedDownloadsTableData.splice(
              state.queuedDownloadsTableData.findIndex(dload => dload.id === postId),
              1
            )
          }

          state.downloadHistoryTableData.unshift(updatedDownload)
        })
        .with({ type: 'download-progress' }, () => {
          const updatedDownloadProps = {
            downloadFileSize: eventAndData.data.downloadFileSize as number,
            downloadedBytes: eventAndData.data.downloadedBytes as number,
            downloadSpeed: eventAndData.data.downloadSpeed as number,
            downloadProgress: eventAndData.data.downloadProgress as number,
          }

          const updatedDownload = createUpdatedDownload(postId, updatedDownloadProps)

          masterListOfDownloads.set(postId, updatedDownload)

          const downloadInTableData = state.activeDownloadsTableData.find(
            download => download.id === postId
          ) as FrontendDownload

          downloadInTableData.downloadFileSize = updatedDownloadProps.downloadFileSize
          downloadInTableData.downloadedBytes = updatedDownloadProps.downloadedBytes
          downloadInTableData.downloadSpeed = updatedDownloadProps.downloadSpeed
          downloadInTableData.downloadProgress = updatedDownloadProps.downloadProgress
        })
        .run()
    },
    Err: msg => console.error(msg),
  })
}

const evtSource = new EventSource('/admin/api/sse-media-downloads-viewer')

evtSource.addEventListener('page-load', replaceTableData)
evtSource.addEventListener('new-download-batch-started', replaceTableData)

evtSource.addEventListener('downloads-cleared', (): void => {
  console.log('downloads-cleared')

  masterListOfDownloads.clear()
  state.activeDownloadsTableData = []
  state.downloadHistoryTableData = []
  state.queuedDownloadsTableData = []
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
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  components: { VScrollGrid },
  methods: {},
  template: /* html */ `
    <v-scroll-grid></v-scroll-grid>
  `,
})

const app = Vue.createApp(AdminDownloadsViewer)

// warnHandler is ignored in production https://v3.vuejs.org/api/application-config.html#warnhandler
app.config.warnHandler = ignoreScriptTagCompilationWarnings

app.mount('main')

export { FrontendDownload }
