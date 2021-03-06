import * as R from 'ramda'
import RA from 'ramda-adjunct'
import { match, __ } from 'ts-pattern'
import type { FastifyReply, FastifyRequest } from 'fastify'

import {
  adminMediaDownloadsViewerOrganiser,
  adminMediaDownloadsViewerOrganiserEmitter,
} from '../../../downloads/media/media-downloads-viewer-organiser'
import type { PostWithMediaDownloadInfo } from '../../../downloads/media/media-downloads-viewer-organiser'

type PostId = string

type DownloadsMap = Map<string, PostWithMediaDownloadInfo>

type DownloadUpdateData = {
  postId: PostId
  reason?: string
  err?: string
  downloadFileSize?: number
  downloadedBytes?: number
  downloadSpeed?: number
  downloadProgress?: number
}

type TrimmedDownloadProps = Pick<
  PostWithMediaDownloadInfo,
  | 'id'
  | 'url'
  | 'permalink'
  | 'mediaDownloadTries'
  | 'downloadFailed'
  | 'downloadError'
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
>

type SSEData = DownloadReadyToBeSent[] | DownloadUpdateData | null

type SSE = { event: string; data: SSEData }

type DownloadReadyToBeSent = Omit<
  TrimmedDownloadProps,
  | 'mediaDownloadTries'
  | 'downloadFailed'
  | 'downloadError'
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
> & {
  // setting these specifically as optional as they may be removed by removePropsWithNoData.
  mediaDownloadTries?: number
  downloadError?: string
  downloadFailed?: boolean
  downloadCancelled?: boolean
  downloadCancellationReason?: string
  downloadSkipped?: boolean
  downloadSkippedReason?: string
  downloadStarted?: boolean
  downloadSucceeded?: boolean
  downloadProgress?: number
  downloadSpeed?: number
  downloadedBytes?: number
  downloadFileSize?: number
}

const removePropsWithNoData = R.pickBy((val: DownloadReadyToBeSent[keyof DownloadReadyToBeSent]) =>
  match(val)
    .with(__.string, RA.isNonEmptyString)
    .with(__.number, (v: number) => v > 0)
    .with(__.boolean, (v: boolean) => v !== false)
    .with(__.nullish, () => false)
    .otherwise(() => true)
)

const stringifyAnyErrors = (download: TrimmedDownloadProps): DownloadReadyToBeSent => ({
  ...download,
  downloadError: R.when(RA.isError, R.toString, download.downloadError) as DownloadReadyToBeSent['downloadError'],
})

/*****
  Since we might be sending data of tens of thousands of downloads to the frontend, its
  prolly a good idea to strip away object keys that have no data in them and reacreate
  them on the frontend.
*****/
const convertDownloadsMapForFrontend = (downloads: DownloadsMap): DownloadReadyToBeSent[] =>
  [...downloads.values()]
    .map(
      R.pick([
        'id',
        'url',
        'permalink',
        'mediaDownloadTries',
        'downloadFailed',
        'downloadError',
        'downloadCancelled',
        'downloadCancellationReason',
        'downloadSkipped',
        'downloadSkippedReason',
        'downloadStarted',
        'downloadSucceeded',
        'downloadProgress',
        'downloadSpeed',
        'downloadedBytes',
        'downloadFileSize',
      ])
    )
    .map(stringifyAnyErrors)
    .map(removePropsWithNoData) as DownloadReadyToBeSent[]

const createSSEEvent = ({ event, data }: SSE): string => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`

// eslint-disable-next-line max-lines-per-function
function SSEHandler(request: FastifyRequest, reply: FastifyReply): void {
  reply.raw.setHeader('Content-Type', 'text/event-stream')
  reply.raw.setHeader('Cache-Control', 'no-cache')
  reply.raw.setHeader('x-no-compression', 'true')
  reply.raw.setHeader('Connection', 'keep-alive')

  reply.raw.write(
    createSSEEvent({
      event: 'page-load',
      data: convertDownloadsMapForFrontend(adminMediaDownloadsViewerOrganiser.posts),
    })
  )

  const newDownloadBatchStarted = (downloads: DownloadsMap): void => {
    reply.raw.write(
      createSSEEvent({
        event: 'new-download-batch-started',
        data: convertDownloadsMapForFrontend(downloads),
      })
    )
  }

  const downloadsCleared = (): void => {
    reply.raw.write(
      createSSEEvent({
        event: 'downloads-cleared',
        data: null,
      })
    )
  }

  const aDownloadStarted = (postId: string): void => {
    reply.raw.write(
      createSSEEvent({
        event: 'download-started',
        data: { postId },
      })
    )
  }

  const aDownloadFailed = (postId: string, err?: Error): void => {
    const error = err ? err.toString() : ''

    reply.raw.write(
      createSSEEvent({
        event: 'download-failed',
        data: { postId, err: error },
      })
    )
  }

  const aDownloadSucceeded = (postId: string): void => {
    reply.raw.write(
      createSSEEvent({
        event: 'download-succeeded',
        data: { postId },
      })
    )
  }

  const aDownloadCancelled = (postId: string, reason: string): void => {
    reply.raw.write(
      createSSEEvent({
        event: 'download-cancelled',
        data: { postId, reason },
      })
    )
  }

  const aDownloadSkipped = (postId: string, reason: string): void => {
    reply.raw.write(
      createSSEEvent({
        event: 'download-skipped',
        data: { postId, reason },
      })
    )
  }

  const progressOfADownload = (
    postId: string,
    downloadFileSize: number,
    downloadedBytes: number,
    downloadSpeed: number,
    downloadProgress: number
    // eslint-disable-next-line max-params
  ): void => {
    reply.raw.write(
      createSSEEvent({
        event: 'download-progress',
        data: { postId, downloadFileSize, downloadedBytes, downloadSpeed, downloadProgress },
      })
    )
  }

  adminMediaDownloadsViewerOrganiserEmitter.on('new-download-batch-started', newDownloadBatchStarted)
  adminMediaDownloadsViewerOrganiserEmitter.on('downloads-cleared', downloadsCleared)
  adminMediaDownloadsViewerOrganiserEmitter.on('download-started', aDownloadStarted)
  adminMediaDownloadsViewerOrganiserEmitter.on('download-failed', aDownloadFailed)
  adminMediaDownloadsViewerOrganiserEmitter.on('download-succeeded', aDownloadSucceeded)
  adminMediaDownloadsViewerOrganiserEmitter.on('download-cancelled', aDownloadCancelled)
  adminMediaDownloadsViewerOrganiserEmitter.on('download-skipped', aDownloadSkipped)
  adminMediaDownloadsViewerOrganiserEmitter.on('download-progress', progressOfADownload)

  // https://github.com/fastify/fastify/issues/1352#issuecomment-490997485
  request.raw.on('close', () => {
    adminMediaDownloadsViewerOrganiserEmitter.removeListener(
      'new-download-batch-started',
      newDownloadBatchStarted
    )
    adminMediaDownloadsViewerOrganiserEmitter.removeListener('downloads-cleared', downloadsCleared)
    adminMediaDownloadsViewerOrganiserEmitter.removeListener('download-started', aDownloadStarted)
    adminMediaDownloadsViewerOrganiserEmitter.removeListener('download-failed', aDownloadFailed)
    adminMediaDownloadsViewerOrganiserEmitter.removeListener('download-succeeded', aDownloadSucceeded)
    adminMediaDownloadsViewerOrganiserEmitter.removeListener('download-cancelled', aDownloadCancelled)
    adminMediaDownloadsViewerOrganiserEmitter.removeListener('download-skipped', aDownloadSkipped)
    adminMediaDownloadsViewerOrganiserEmitter.removeListener('download-progress', progressOfADownload)
  })
}

export { SSEHandler, DownloadUpdateData, DownloadReadyToBeSent }
