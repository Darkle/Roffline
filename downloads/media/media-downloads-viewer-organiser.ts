import { EventEmitter } from 'events'

import { Post } from '../../db/entities/Posts/Post'

type PostWithMediaDownloadInfo = {
  downloadFailed: boolean
  downloadError: undefined | Error
  downloadCancelled: boolean
  downloadCancellationReason: string
  downloadStarted: boolean
  downloadSucceeded: boolean
  downloadProgress: number
  downloadFileSize: number
} & Post

class AdminMediaDownloadsViewerOrganiserEmitter extends EventEmitter {}

const adminMediaDownloadsViewerOrganiserEmitter = new AdminMediaDownloadsViewerOrganiserEmitter()

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
      downloadStarted: false,
      downloadSucceeded: false,
      downloadProgress: 0,
      downloadFileSize: 0,
    })
  },
  initializeWithNewPosts(posts: Post[]): void {
    this.posts.clear()
    posts.forEach(this.addSinglePost)
    adminMediaDownloadsViewerOrganiserEmitter.emit('new-download-batch-started', this.posts)
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
    this.setDownloadFailed(postId, new Error(reason))
  },
  setDownloadProgress(postId: string, downloadProgress: number, downloadFileSize = 0): void {
    const post = this.posts.get(postId) as PostWithMediaDownloadInfo
    this.posts.set(postId, { ...post, downloadProgress, downloadFileSize })
    adminMediaDownloadsViewerOrganiserEmitter.emit(
      'download-progress',
      postId,
      downloadProgress,
      downloadFileSize
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
