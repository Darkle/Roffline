import { EventEmitter } from 'tsee'

import type { Post } from '../../db/entities/Posts/Post'

type PostWithMediaDownloadInfo = {
  downloadFailed: boolean
  downloadError: Error | undefined
  downloadCancelled: boolean
  downloadCancellationReason: string
  downloadSkipped: boolean
  downloadSkippedReason: string
  downloadStarted: boolean
  downloadSucceeded: boolean
  downloadProgress: number
  downloadSpeed: number
  downloadedBytes: number
  downloadFileSize: number
} & Post

/* eslint-disable no-spaced-func,func-call-spacing */
const adminMediaDownloadsViewerOrganiserEmitter = new EventEmitter<{
  'new-download-batch-started': (posts: Map<string, PostWithMediaDownloadInfo>) => void
  'downloads-cleared': () => void
  'download-started': (postId: string) => void
  'download-failed': (postId: string, err: Error | undefined) => void
  'download-succeeded': (postId: string) => void
  'download-cancelled': (postId: string, reason: string) => void
  'download-skipped': (postId: string, reason: string) => void
  'download-progress': (
    postId: string,
    downloadFileSize: number,
    downloadedBytes: number,
    downloadSpeed: number,
    downloadProgress: number
  ) => void
  'download-media-try-increment': (postId: string) => void
}>()

/*****
  adminMediaDownloadsViewerOrganiser keeps track of the media downloads for the admin media downloads viewer page.
  We send all the downloads through on page load and then update with event emitter.
*****/
const adminMediaDownloadsViewerOrganiser = {
  posts: new Map<string, PostWithMediaDownloadInfo>(),
  addSinglePost(post: Post): void {
    this.posts.set(post.id, {
      ...post,
      downloadFailed: false,
      downloadError: undefined,
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
    })
  },
  initializeWithNewPosts(posts: Post[]): void {
    this.posts.clear()
    posts.forEach(this.addSinglePost.bind(this))
    adminMediaDownloadsViewerOrganiserEmitter.emit('new-download-batch-started', this.posts)
  },
  clearAllDownloads(): void {
    this.posts.clear()
    adminMediaDownloadsViewerOrganiserEmitter.emit('downloads-cleared')
  },
  setDownloadStarted(postId: string): void {
    const post = this.posts.get(postId) as PostWithMediaDownloadInfo
    this.posts.set(postId, { ...post, downloadStarted: true })
    adminMediaDownloadsViewerOrganiserEmitter.emit('download-started', postId)
  },
  setDownloadFailed(postId: string, err?: Error): void {
    const post = this.posts.get(postId) as PostWithMediaDownloadInfo
    this.posts.set(postId, { ...post, downloadFailed: true, downloadError: err })
    adminMediaDownloadsViewerOrganiserEmitter.emit('download-failed', postId, err)
  },
  setDownloadSucceeded(postId: string): void {
    const post = this.posts.get(postId) as PostWithMediaDownloadInfo
    this.posts.set(postId, { ...post, downloadSucceeded: true })
    adminMediaDownloadsViewerOrganiserEmitter.emit('download-succeeded', postId)
  },
  setDownloadCancelled(postId: string, reason = ''): void {
    const post = this.posts.get(postId) as PostWithMediaDownloadInfo
    this.posts.set(postId, { ...post, downloadCancelled: true, downloadCancellationReason: reason })
    adminMediaDownloadsViewerOrganiserEmitter.emit('download-cancelled', postId, reason)
  },
  setDownloadSkipped(postId: string, reason = ''): void {
    const post = this.posts.get(postId) as PostWithMediaDownloadInfo
    this.posts.set(postId, { ...post, downloadSkipped: true, downloadSkippedReason: reason })
    adminMediaDownloadsViewerOrganiserEmitter.emit('download-skipped', postId, reason)
  },
  setDownloadProgress(postId: string, downloadFileSize = 0, downloadedBytes = 0, downloadSpeed = 0): void {
    const post = this.posts.get(postId) as PostWithMediaDownloadInfo

    // yt-dlp has fractional speed, so account for that.
    const dlSpeed = downloadSpeed === 0 ? downloadSpeed : Number(downloadSpeed.toFixed(0))

    const downloadProgress =
      downloadFileSize === 0 || downloadedBytes === 0
        ? 0
        : Number((downloadedBytes / downloadFileSize).toPrecision(1))

    this.posts.set(postId, { ...post, downloadProgress, downloadFileSize, downloadedBytes })

    adminMediaDownloadsViewerOrganiserEmitter.emit(
      'download-progress',
      postId,
      downloadFileSize,
      downloadedBytes,
      dlSpeed,
      downloadProgress
    )
  },
  incrementPostMediaDownloadTry(postId: string): void {
    const post = this.posts.get(postId) as PostWithMediaDownloadInfo
    this.posts.set(postId, { ...post, mediaDownloadTries: post.mediaDownloadTries + 1 })
    adminMediaDownloadsViewerOrganiserEmitter.emit('download-media-try-increment', postId)
  },
}

export {
  adminMediaDownloadsViewerOrganiser,
  adminMediaDownloadsViewerOrganiserEmitter,
  PostWithMediaDownloadInfo,
}
