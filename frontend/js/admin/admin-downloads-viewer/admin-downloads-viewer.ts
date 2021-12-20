import { encaseRes } from 'pratica'
import type { Result } from 'pratica'
import { match } from 'ts-pattern'

// import { tableColumns } from './table-columns'
import type { PostWithMediaDownloadInfo } from '../../../../downloads/media/media-downloads-viewer-organiser'
import type {
  DownloadReadyToBeSent,
  DownloadUpdateData,
} from '../../../../server/controllers/admin/server-side-events'

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

/* eslint-disable max-lines-per-function,functional/no-let */

const masterListOfDownloads = new Map() as Map<PostId, FrontendDownload>

let activeDownloadsListData = [] as FrontendDownload[]
let downloadHistoryListData = [] as FrontendDownload[]
let queuedDownloadsListData = [] as FrontendDownload[]

/*****
  We removed empty keys server side to make the payload smaller.
  Now we recreate them.
*****/
const reconstructMinimizedDownloadData = (download: DownloadReadyToBeSent): FrontendDownload => {
  const downloadStatus = match(download)
    .with({ downloadStarted: true }, () => 'active')
    .with({ downloadFailed: true }, () => 'history')
    .with({ downloadCancelled: true }, () => 'history')
    .with({ downloadSkipped: true }, () => 'history')
    .with({ downloadSucceeded: true }, () => 'history')
    .otherwise(() => 'queue') as DownloadStatus

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

const tryParseSSEData = (
  data: string
): Result<DownloadReadyToBeSent[] | UpdateDownloadPropsParsedData, unknown> =>
  encaseRes(() => JSON.parse(data) as DownloadReadyToBeSent[] | UpdateDownloadPropsParsedData)

function replaceDownloadListsData(ev: Event): void {
  const { data } = ev as SSEEvent

  tryParseSSEData(data).cata({
    Ok: (parsedData): void => {
      const downloads = (parsedData as DownloadReadyToBeSent[]).map(
        reconstructMinimizedDownloadData
      ) as FrontendDownload[]

      console.info(downloads)

      activeDownloadsListData = []
      downloadHistoryListData = []
      queuedDownloadsListData = downloads

      masterListOfDownloads.clear()

      downloads.forEach(download => {
        masterListOfDownloads.set(download.id, download)
      })
    },
    Err: console.error,
  })
}

type UpdateDownloadPropsParsedData = { type: string; data: DownloadUpdateData }

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

          updateDownloadInMasterList(postId, updatedDownload)
          moveDownloadToOtherList(updatedDownload, queuedDownloadsListData, activeDownloadsListData)
        })
        .with({ type: 'download-failed' }, () => {
          const updatedDownloadProps = {
            status: 'history' as DownloadStatus,
            downloadFailed: true,
            downloadError: eventAndData.data.err as string,
          }

          const updatedDownload = createUpdatedDownload(postId, updatedDownloadProps)

          updateDownloadInMasterList(postId, updatedDownload)
          moveDownloadToOtherList(updatedDownload, activeDownloadsListData, downloadHistoryListData)
        })
        .with({ type: 'download-succeeded' }, () => {
          const updatedDownloadProps = { status: 'history' as DownloadStatus, downloadSucceeded: true }

          const updatedDownload = createUpdatedDownload(postId, updatedDownloadProps)

          updateDownloadInMasterList(postId, updatedDownload)
          moveDownloadToOtherList(updatedDownload, activeDownloadsListData, downloadHistoryListData)
        })
        .with({ type: 'download-cancelled' }, () => {
          const updatedDownloadProps = {
            status: 'history' as DownloadStatus,
            downloadCancelled: true,
            downloadCancellationReason: eventAndData.data.reason as string,
          }

          const updatedDownload = createUpdatedDownload(postId, updatedDownloadProps)

          updateDownloadInMasterList(postId, updatedDownload)
          moveDownloadToOtherList(updatedDownload, activeDownloadsListData, downloadHistoryListData)
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
            oldDownloadStatus === 'active' ? activeDownloadsListData : queuedDownloadsListData,
            downloadHistoryListData
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

          const downloadInList = activeDownloadsListData.find(
            download => download.id === postId
          ) as FrontendDownload

          downloadInList.downloadFileSize = updatedDownloadProps.downloadFileSize
          downloadInList.downloadedBytes = updatedDownloadProps.downloadedBytes
          downloadInList.downloadSpeed = updatedDownloadProps.downloadSpeed
          downloadInList.downloadProgress = updatedDownloadProps.downloadProgress
        })
        .run()
    },
    Err: console.error,
  })
}

const evtSource = new EventSource('/admin/api/sse-media-downloads-viewer')

evtSource.addEventListener('page-load', replaceDownloadListsData)
evtSource.addEventListener('new-download-batch-started', replaceDownloadListsData)

evtSource.addEventListener('downloads-cleared', (): void => {
  console.log('downloads-cleared')

  masterListOfDownloads.clear()
  activeDownloadsListData = []
  downloadHistoryListData = []
  queuedDownloadsListData = []
})

evtSource.addEventListener('download-started', updateDownloadProps)
evtSource.addEventListener('download-failed', updateDownloadProps)
evtSource.addEventListener('download-succeeded', updateDownloadProps)
evtSource.addEventListener('download-cancelled', updateDownloadProps)
evtSource.addEventListener('download-skipped', updateDownloadProps)
evtSource.addEventListener('download-progress', updateDownloadProps)
evtSource.addEventListener('error', err => console.error(err))

window.addEventListener('beforeunload', () => evtSource.close())
