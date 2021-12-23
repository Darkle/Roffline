import * as R from 'ramda'
import * as RA from 'ramda-adjunct'
import { encaseRes, nullable as MaybeNullable } from 'pratica'
import type { Result } from 'pratica'
import { match } from 'ts-pattern'

import type { DownloadUpdateData } from '../../../../server/controllers/admin/server-side-events'
import { reconstructMinimizedDownloadData } from './reconstruct-minimized-download-data'
import { state } from './admin-downloads-viewer-state'
import type {
  FrontendDownload,
  PostId,
  DownloadsFromBackend,
  DownloadStatus,
  SSEEvent,
  UpdateProps,
  UpdateDownloadPropsParsedData,
} from './admin-downloads-viewer.d'

/* eslint-disable max-lines-per-function,functional/no-conditional-statement,functional/immutable-data */

const tryParseSSEData = (data: string): Result<DownloadsFromBackend[] | DownloadUpdateData, unknown> =>
  encaseRes(() => JSON.parse(data) as DownloadsFromBackend[] | DownloadUpdateData)

function replaceDownloadListsData(ev: Event): void {
  const { data } = ev as SSEEvent

  tryParseSSEData(data).cata({
    Ok: (parsedData): void => {
      const downloads = (parsedData as DownloadsFromBackend[]).map(reconstructMinimizedDownloadData)

      console.info(downloads)

      state.activeDownloadsListData = downloads.filter(R.propEq('status', 'active'))
      state.downloadHistoryListData = downloads.filter(R.propEq('status', 'history'))
      state.queuedDownloadsListData = downloads.filter(R.propEq('status', 'queued'))

      state.masterListOfDownloads.clear()

      downloads.forEach(download => {
        state.masterListOfDownloads.set(download.id, download)
      })
    },
    Err: err => console.error(err),
  })
}

const createUpdatedDownload = (postId: PostId, updatedDownloadProps: UpdateProps): FrontendDownload => {
  const currentDownload = state.masterListOfDownloads.get(postId) as FrontendDownload
  return { ...currentDownload, ...updatedDownloadProps }
}

const updateDownloadInMasterList = (postId: PostId, updatedDownload: FrontendDownload): void => {
  state.masterListOfDownloads.set(postId, updatedDownload)
}

const downloadMatchesSearch = (download: FrontendDownload): boolean =>
  !!Object.values(download)
    .filter(R.is(String))
    .find(val => val.includes(state.searchTerm))

const downloadMatchesFilter = (download: FrontendDownload): boolean =>
  match(download)
    .with({ downloadSucceeded: true }, () => state.currentHistoryFilter === 'succeeded', R.T)
    .with({ downloadSkipped: true }, () => state.currentHistoryFilter === 'skipped', R.T)
    .with({ downloadCancelled: true }, () => state.currentHistoryFilter === 'cancelled', R.T)
    .with({ downloadFailed: true }, () => state.currentHistoryFilter === 'failed', R.T)
    .otherwise(R.F)

// eslint-disable-next-line complexity
const moveDownloadToOtherList = (
  updatedDownload: FrontendDownload,
  listDataDownloadCurrentlyResidesIn: FrontendDownload[],
  listDataToMoveDownloadTo: FrontendDownload[]
): void => {
  if (state.updatesPaused) return

  const downloadIndexInListData = listDataDownloadCurrentlyResidesIn.findIndex(R.propEq('id', updatedDownload.id))

  if (downloadIndexInListData !== -1) {
    // https://mzl.la/3mp0RLT
    listDataDownloadCurrentlyResidesIn.splice(downloadIndexInListData, 1)
  }

  const isDownloadHistoryList = listDataToMoveDownloadTo === state.downloadHistoryListData

  if (state.isSearching) {
    if (
      state.isFilteringHistory &&
      isDownloadHistoryList &&
      downloadMatchesSearch(updatedDownload) &&
      downloadMatchesFilter(updatedDownload)
    ) {
      listDataToMoveDownloadTo.unshift(updatedDownload)
      return
    }

    if (downloadMatchesSearch(updatedDownload)) {
      listDataToMoveDownloadTo.unshift(updatedDownload)
      return
    }

    return
  }

  if (state.isFilteringHistory && isDownloadHistoryList) {
    if (downloadMatchesFilter(updatedDownload)) {
      listDataToMoveDownloadTo.unshift(updatedDownload)
      return
    }

    return
  }

  listDataToMoveDownloadTo.unshift(updatedDownload)
}

function updateDownloadProps(ev: Event): void {
  const { data } = ev as SSEEvent

  tryParseSSEData(data).cata({
    Ok: (parsedData): void => {
      const eventAndData = { data: parsedData, type: ev.type } as UpdateDownloadPropsParsedData

      // console.info(eventAndData)

      const { postId } = eventAndData.data
      const downloadFromMasterList = state.masterListOfDownloads.get(postId) as FrontendDownload

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
          const oldDownloadStatus = state.masterListOfDownloads.get(postId)?.status as DownloadStatus

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

function initSSEListeners(): void {
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
}

export { initSSEListeners }
