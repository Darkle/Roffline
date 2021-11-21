import { Post } from '../db/entities/Posts/Post'

type PostId = string
type Subreddit = string

type DownloadsStore = {
  subsToUpdate: Set<Subreddit>
  moreSubsToUpdate: () => boolean
  commentsToRetrieved: Set<PostId>
  moreCommentsToRetrieved: () => boolean
  postsMediaToBeDownloaded: Map<PostId, Post>
  morePostsMediaToBeDownloaded: () => boolean
  moreToDownload: () => boolean
}

const downloadsStore: DownloadsStore = {
  subsToUpdate: new Set(),
  moreSubsToUpdate(): boolean {
    return this.subsToUpdate.size > 0
  },
  commentsToRetrieved: new Set(),
  moreCommentsToRetrieved(): boolean {
    return this.commentsToRetrieved.size > 0
  },
  postsMediaToBeDownloaded: new Map(),
  morePostsMediaToBeDownloaded(): boolean {
    return this.postsMediaToBeDownloaded.size > 0
  },
  moreToDownload(): boolean {
    return this.moreSubsToUpdate() || this.moreCommentsToRetrieved() || this.morePostsMediaToBeDownloaded()
  },
}

export { downloadsStore }
