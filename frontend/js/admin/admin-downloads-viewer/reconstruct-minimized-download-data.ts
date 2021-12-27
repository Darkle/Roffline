import { match } from 'ts-pattern'

import type { DownloadsFromBackend, DownloadStatus, FrontendDownload } from './admin-downloads-viewer.d'

/*****
  We removed empty keys server side to make the payload smaller.
  Now we recreate them.
*****/
// eslint-disable-next-line max-lines-per-function
const reconstructMinimizedDownloadData = (download: DownloadsFromBackend): FrontendDownload => {
  const downloadStatus = match(download)
    .with({ downloadFailed: true }, () => 'history')
    .with({ downloadCancelled: true }, () => 'history')
    .with({ downloadSkipped: true }, () => 'history')
    .with({ downloadSucceeded: true }, () => 'history')
    // It's possible for downloadSucceeded to be true when others are true as well, so check others arent true too.
    .with(
      {
        downloadSucceeded: true,
        downloadSkipped: false,
        downloadCancelled: false,
        downloadFailed: false,
      },
      () => 'active'
    )
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
