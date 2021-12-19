import * as R from 'ramda'
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

type DownloadReadyToBeSent = Pick<TrimmedDownloadProps, 'id' | 'url' | 'permalink' | 'mediaDownloadTries'>

type SSEData = DownloadReadyToBeSent[] | DownloadUpdateData | null

type SSE = { event: string; data: SSEData }

type TrimmedDownloadProps = Pick<PostWithMediaDownloadInfo, 'id' | 'url' | 'permalink' | 'mediaDownloadTries'>

/*****
  Since we might be sending data of tens of thousands of downloads to the frontend, its
  prolly a good idea to strip away object keys that have no data in them and reacreate
  them on the frontend. Since these are inital loads, only 'id', 'url', 'permalink', 'mediaDownloadTries'
  keys have data in them.
*****/
const convertDownloadsMapForFrontend = (downloads: DownloadsMap): DownloadReadyToBeSent[] =>
  [...downloads.values()].map(R.pick(['id', 'url', 'permalink', 'mediaDownloadTries']))

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

  const downloadTryIncrementForDownload = (postId: string): void => {
    reply.raw.write(
      createSSEEvent({
        event: 'download-media-try-increment',
        data: { postId },
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
  adminMediaDownloadsViewerOrganiserEmitter.on('download-media-try-increment', downloadTryIncrementForDownload)

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
    adminMediaDownloadsViewerOrganiserEmitter.removeListener(
      'download-media-try-increment',
      downloadTryIncrementForDownload
    )
  })
}

export { SSEHandler, DownloadUpdateData, DownloadReadyToBeSent }
