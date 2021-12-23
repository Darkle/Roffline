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

type UpdateDownloadPropsParsedData = { type: string; data: DownloadUpdateData }

type DownloadsFromBackend = DownloadReadyToBeSent

type Filter = 'all' | 'succeeded' | 'skipped' | 'cancelled' | 'failed'

export {
  FrontendDownload,
  Filter,
  PostId,
  DownloadsFromBackend,
  DownloadStatus,
  SSEEvent,
  UpdateProps,
  UpdateDownloadPropsParsedData,
}
