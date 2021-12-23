import { match } from 'ts-pattern'
/*****
  We removed empty keys server side to make the payload smaller.
  Now we recreate them.
*****/

import type { DownloadsFromBackend, DownloadStatus, FrontendDownload } from './admin-downloads-viewer.d'

// eslint-disable-next-line max-lines-per-function
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

export { reconstructMinimizedDownloadData }
