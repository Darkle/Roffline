import fetch from 'node-fetch-commonjs'
import Prray from 'prray'
import { Packr } from 'msgpackr'
import type { Response } from 'node-fetch-commonjs'
import recursiveObjFilter from 'deep-filter-object'

import type { AdminSettings } from '../../db/entities/AdminSettings'
import { db } from '../../db/db'
import { isDev, isNotError } from '../../server/utils'
import { commentsDownloadsLogger } from '../../logging/logging'
import { logGetCommentsProgress } from './log-get-comments-progress'
import type { UnformattedCommentsData, FetchedCommentContainer } from '../../db/entities/Comments'

type PostId = string
type CommentsWithPostId = { id: PostId; comments: Buffer }

const msgpackPacker = new Packr()

const createFetchError = (resp: Response): Error =>
  new Error(resp.statusText?.length ? resp.statusText : resp.status.toString())

const handleCommentFetchResponse = (resp: Response): Promise<UnformattedCommentsData> =>
  resp.ok ? (resp.json() as Promise<UnformattedCommentsData>) : Promise.reject(createFetchError(resp))

const commentsObjKeysToKeep = [
  'data',
  'children',
  'id',
  'replies',
  'created_utc',
  'author',
  'score',
  'permalink',
  'body_html',
]

/*****
  Even though lmdb can automatically convert to messagepack, we want to manually
  convert here as when we do it all at once when saving all the comments to the db
  it takes a long time. Doing it here manually one at a time breaks this up.
  We are also ommitting anything that we dont need in the comments as there is a
  lot of excess data we dont need in the comments.
*****/
const formatCommentsForDB = (comments: FetchedCommentContainer[]): Buffer =>
  msgpackPacker.pack(comments.map(comment => recursiveObjFilter(comment, commentsObjKeysToKeep)))

const assocCommentsWithPostId = (postId: PostId, comments: UnformattedCommentsData): CommentsWithPostId => ({
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
