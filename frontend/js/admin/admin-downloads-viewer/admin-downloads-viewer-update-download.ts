import * as R from 'ramda'
import * as RA from 'ramda-adjunct'
import { encaseRes as TryRes, nullable as MaybeNullable } from 'pratica'
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
  TryRes(() => JSON.parse(data) as DownloadsFromBackend[] | DownloadUpdateData)

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

const downloadHasNo404Error = (download: FrontendDownload): boolean =>
  !Object.values(download)
    .filter(R.is(String))
    .find(
      val =>
        val.includes('404 Not Found') ||
        val.includes('Error: Response status was 404') ||
        val.includes('HTTP Error 404: Not Found')
    )

const downloadMatchesFilter = (download: FrontendDownload): boolean =>
  match(download)
    .with(
      {
        downloadSucceeded: true,
        downloadSkipped: false,
        downloadCancelled: false,
        downloadFailed: false,
      },
      () => state.currentHistoryFilter === 'succeeded',
      R.T
    )
    .with({ downloadSkipped: true }, () => state.currentHistoryFilter === 'skipped', R.T)
    .with({ downloadCancelled: true }, () => state.currentHistoryFilter === 'cancelled', R.T)
    .with(
      { downloadFailed: true },
      () => state.currentHistoryFilter === 'failed-no-404' && downloadHasNo404Error(download),
      R.T
    )
    .with({ downloadFailed: true }, () => state.currentHistoryFilter === 'failed', R.T)
    .otherwise(R.F)

const removeDownloadFromCurrentList = (
  updatedDownload: FrontendDownload,
  listDataDownloadCurrentlyResidesIn: FrontendDownload[]
): void => {
  const downloadIndexInListData = listDataDownloadCurrentlyResidesIn.findIndex(R.propEq('id', updatedDownload.id))

  if (downloadIndexInListData !== -1) {
    // https://mzl.la/3mp0RLT
    listDataDownloadCurrentlyResidesIn.splice(downloadIndexInListData, 1)
  }
}

// eslint-disable-next-line complexity
const moveDownloadToOtherList = (
  updatedDownload: FrontendDownload,
  listDataDownloadCurrentlyResidesIn: FrontendDownload[],
  listDataToMoveDownloadTo: FrontendDownload[]
): void => {
  if (state.updatesPaused) return

  removeDownloadFromCurrentList(updatedDownload, listDataDownloadCurrentlyResidesIn)

  const moveOrUpdate = (): void => {
    /*****
     `skipped` can be called before `failed`, so we need to check if its already in the
     list and update the existing download, otherwise insert it into the list.
     *****/
    const downloadIsInListToMoveTo = listDataToMoveDownloadTo.find(dl => dl.id === updatedDownload.id)

    if (downloadIsInListToMoveTo) {
      const index = listDataToMoveDownloadTo.findIndex(dl => dl.id === updatedDownload.id)
      // eslint-disable-next-line no-param-reassign
      listDataToMoveDownloadTo[index] = updatedDownload
    } else {
      listDataToMoveDownloadTo.unshift(updatedDownload)
    }
  }

  if (state.isSearching) {
    return downloadMatchesSearch(updatedDownload) ? moveOrUpdate() : RA.noop()
  }

  const movingDownloadToHistoryList = listDataToMoveDownloadTo === state.downloadHistoryListData

  if (state.isFilteringHistory && movingDownloadToHistoryList) {
    return downloadMatchesFilter(updatedDownload) ? moveOrUpdate() : RA.noop()
  }

  moveOrUpdate()
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

          /*****
            We check here in case the user cancelled the download, in which case it has already failed.
            (shouldnt move/add it if its already been moved/added)
          *****/
          if (state.masterListOfDownloads.get(postId)?.downloadFailed) return

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
            downloadFailed: true,
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

export { replaceDownloadListsData, updateDownloadProps, downloadMatchesSearch, downloadHasNo404Error }
