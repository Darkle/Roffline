import path from 'path'

import Prray from 'prray'
import RA from 'ramda-adjunct'
import { db } from '../../db/db'

import { mediaDownloadsLogger } from '../../logging/logging'
import { getEnvFilePath, pDeleteFolder } from '../../server/utils'

type PostId = string

const postsMediaContainerFolder = getEnvFilePath(process.env['POSTS_MEDIA_DOWNLOAD_DIR'])

const concurrency = 4

const getPostMediaFolder = (postId: PostId): string => path.join(postsMediaContainerFolder, postId)

const removeMediaFolder = (postId: PostId): Promise<void> =>
  pDeleteFolder(getPostMediaFolder(postId)).catch(err => {
    mediaDownloadsLogger.error(`There was an error deleting the media folder for post ${postId}`, err)
  })

const removePostsMediaFolders = (posts: PostId[]): Promise<void> =>
  RA.isNonEmptyArray(posts)
    ? Prray.from(posts).forEachAsync(removeMediaFolder, { concurrency })
    : Promise.resolve()

async function removeAnyPostsNoLongerNeeded(): Promise<void> {
  const postIdsToRemove = await db.findPostsWhichHaveNoSubOwner()

  await Promise.all([
    db.batchRemovePosts(postIdsToRemove),
    db.batchRemoveComments(postIdsToRemove),
    removePostsMediaFolders(postIdsToRemove),
  ])
}

export { removeAnyPostsNoLongerNeeded }
