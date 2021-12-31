import fetch from 'node-fetch-commonjs'
import Prray from 'prray'
import { Packr } from 'msgpackr'
import type { Response } from 'node-fetch-commonjs'
// @ts-expect-error asd
import deepFilter from 'deep-filter-object'

import type { AdminSettings } from '../../db/entities/AdminSettings'
import { db } from '../../db/db'
import { isDev, isNotError } from '../../server/utils'
import { commentsDownloadsLogger } from '../../logging/logging'
import { logGetCommentsProgress } from './log-get-comments-progress'
import type { CommentContainer, CommentsOuterContainer } from '../../db/entities/Comments'

type CommentsFetchResponse = [Record<string, unknown>, CommentsOuterContainer]
type PostId = string
type CommentsWithPostId = { id: PostId; comments: Buffer }

const msgpackPacker = new Packr()

const createFetchError = (resp: Response): Error =>
  new Error(resp.statusText?.length ? resp.statusText : resp.status.toString())

const handleCommentFetchResponse = (resp: Response): Promise<CommentsFetchResponse> =>
  resp.ok ? (resp.json() as Promise<CommentsFetchResponse>) : Promise.reject(createFetchError(resp))

const formatCommentsForDB = (comments: CommentContainer[]): Buffer =>
  msgpackPacker.pack(
    comments.map(comment =>
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-return
      deepFilter(comment, [
        'data',
        'children',
        'id',
        'replies',
        'created_utc',
        'author',
        'score',
        'permalink',
        'body_html',
      ])
    )
  )

const assocCommentsWithPostId = (postId: PostId, comments: CommentsFetchResponse): CommentsWithPostId => ({
  id: postId,
  comments: formatCommentsForDB(comments[1].data.children),
})

const getPostComments = (postId: PostId): Promise<CommentsWithPostId | Error> =>
  fetch(`https://www.reddit.com/comments/${postId}.json`)
    .then(handleCommentFetchResponse)
    .then(comments => assocCommentsWithPostId(postId, comments))
    // We are ignoring errors here as we will get a lot of them when go offline.
    .catch((err: Error) => {
      isDev && console.error(err)
      commentsDownloadsLogger.trace(err)
      return err
    })

const removeItemsThatAreFetchErrors = (comments: (CommentsWithPostId | Error)[]): CommentsWithPostId[] =>
  comments.filter(isNotError) as CommentsWithPostId[]

// eslint-disable-next-line max-lines-per-function
async function getCommentsForPosts(adminSettings: AdminSettings, postIds: Set<PostId>): Promise<string[]> {
  const postIdsForCommentsToRetrieve = [...postIds]

  commentsDownloadsLogger.debug(`Getting comments for ${postIdsForCommentsToRetrieve.length} posts`)

  const comments = await Prray.from(postIdsForCommentsToRetrieve)
    .mapAsync(
      (postId: PostId) => {
        logGetCommentsProgress(postId, postIdsForCommentsToRetrieve)
        return getPostComments(postId)
      },
      {
        concurrency: adminSettings.numberFeedsOrPostsDownloadsAtOnce,
      }
    )
    .then(removeItemsThatAreFetchErrors)

  await db.batchSaveComments(comments)

  await db.batchSetCommentsDownloadedTrueForPosts(postIdsForCommentsToRetrieve)

  const postIdsOfCommentsSuccessfullyRetreived = comments.map(({ id }) => id)

  return postIdsOfCommentsSuccessfullyRetreived
}

export { getCommentsForPosts }
