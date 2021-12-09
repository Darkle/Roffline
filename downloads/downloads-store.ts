import type { Post } from '../db/entities/Posts/Post'

type PostId = string
type Subreddit = string
type DownloadsStoreKey = 'subsToUpdate' | 'commentsToRetrieve' | 'postsMediaToBeDownloaded'
type DownloadsStore = {
  subsToUpdate: Set<Subreddit>
  moreSubsToUpdate: () => boolean
  commentsToRetrieve: Set<PostId>
  moreCommentsToRetrieve: () => boolean
  postsMediaToBeDownloaded: Map<PostId, Post>
  morePostsMediaToBeDownloaded: () => boolean
  moreToDownload: () => boolean
  removeSuccessfullDownloads: (items: string[], downloadsStoreKey: DownloadsStoreKey) => void
}

const downloadsStore: DownloadsStore = {
  subsToUpdate: new Set(),
  moreSubsToUpdate(): boolean {
    return this.subsToUpdate.size > 0
  },
  commentsToRetrieve: new Set(),
  moreCommentsToRetrieve(): boolean {
    return this.commentsToRetrieve.size > 0
  },
  postsMediaToBeDownloaded: new Map(),
  morePostsMediaToBeDownloaded(): boolean {
    return this.postsMediaToBeDownloaded.size > 0
  },
  moreToDownload(): boolean {
    return this.moreSubsToUpdate() || this.moreCommentsToRetrieve() || this.morePostsMediaToBeDownloaded()
  },
  removeSuccessfullDownloads(postIds: string[], downloadsStoreKey: DownloadsStoreKey): void {
    postIds.forEach((item: string) => this[downloadsStoreKey].delete(item))
  },
}

export { downloadsStore, DownloadsStore }
