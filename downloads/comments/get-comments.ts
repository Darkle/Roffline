import R from 'ramda'
import fetch, { Response } from 'node-fetch-commonjs'
import RA from 'ramda-adjunct'
import Prray from 'prray'

import { AdminSettings } from '../../db/entities/AdminSettings'
import { db } from '../../db/db'
import { isDev } from '../../server/utils'
import { commentsDownloadsLogger } from '../../logging/logging'
import { logGetCommentsProgress } from './log-get-comments-progress'

type CommentsWithPostId = { id: string; comments: string }
type PostId = string

const createFetchError = (resp: Response): Error =>
  new Error(resp.statusText?.length ? resp.statusText : resp.status.toString())

const handleCommentFetchResponse = (resp: Response): Promise<string> =>
  /*****
    We are using resp.text() as we are storing the comments as text (for the moment) in lmdb db.
  *****/
  resp.ok ? (resp.text() as Promise<string>) : Promise.reject(createFetchError(resp))

const assocCommentsWithPostId = (postId: PostId, comments: string): CommentsWithPostId => ({
  id: postId,
  comments,
})

const getPostComments = (postId: PostId): Promise<CommentsWithPostId | Error> =>
  fetch(`https://www.reddit.com/comments/${postId}.json`)
    .then(handleCommentFetchResponse)
    .then(commentsAsAString => assocCommentsWithPostId(postId, commentsAsAString))
    // We are ignoring errors here as we will get a lot of them when go offline.
    .catch((err: Error) => {
      isDev && console.error(err)
      commentsDownloadsLogger.trace(err)
      return err
    })

const isNotError = R.complement(RA.isError)

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
