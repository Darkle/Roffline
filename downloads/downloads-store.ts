import { Post } from '../db/entities/Posts/Post'

type PostId = string
type Subreddit = string

type DownloadsStore = {
  subsToUpdate: Set<Subreddit>
  moreSubsToUpdate: () => boolean
  commentsToRetrieve: Set<PostId>
  moreCommentsToRetrieve: () => boolean
  postsMediaToBeDownloaded: Map<PostId, Post>
  morePostsMediaToBeDownloaded: () => boolean
  moreToDownload: () => boolean
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
}

type DownloadsStoreKey = 'subsToUpdate' | 'commentsToRetrieve' | 'postsMediaToBeDownloaded'

function removeSuccessfullDownloadsFromDownloadStore(
  items: string[],
  downloadsStoreKey: DownloadsStoreKey
): void {
  items.forEach((item: string) => downloadsStore[downloadsStoreKey].delete(item))
}

export { downloadsStore, removeSuccessfullDownloadsFromDownloadStore, DownloadsStore }
