import path from 'path'
import Prray from 'prray'
import * as R from 'ramda'
import RA from 'ramda-adjunct'

import { db } from '../../db/db'
import type { AdminSettings } from '../../db/entities/AdminSettings'
import type { Post } from '../../db/entities/Posts/Post'
import { getEnvFilePath, pCreateFolder, isNotError } from '../../server/utils'
import type { DownloadsStore } from '../downloads-store'
import { downloadsStore } from '../downloads-store'
import { downloadIndividualPostMedia } from './download-media-decider'
import { getUrlFromTextPost } from './get-url-from-text-post'
import { logDownloadError } from './log-download-errors'
import { adminMediaDownloadsViewerOrganiser } from './media-downloads-viewer-organiser'
import { isTextPost } from './posts-media-categorizers'
import { isOffline } from '../check-if-offline'
import { spawnedDownloadProcessReferences } from './spawn-external-download-process'
import { directDownloadReferences } from './direct-media-download'

type PostId = string

type PostWithOptionalTextMetaData = Post & { isTextPostWithNoUrlsInPost?: boolean }

type MediaDownload = {
  post: PostWithOptionalTextMetaData
  adminSettings: AdminSettings
  postMediaFolder: string
}

const postsMediaContainerFolder = getEnvFilePath(process.env['POSTS_MEDIA_DOWNLOAD_DIR'])

const maxNumberDownloadTriesAllowed = 3

const tooManyDownloadTries = (post: Post): boolean => post.mediaDownloadTries >= maxNumberDownloadTriesAllowed

const createMediaFolderForPost = (postId: string): Promise<string> => {
  const postMediaFolder = path.join(postsMediaContainerFolder, postId)

  return pCreateFolder(postMediaFolder).then(_ => postMediaFolder)
}

/* eslint-disable functional/no-conditional-statement */

const setPostUrlToArticleInTextIfTextPost = (
  post: PostWithOptionalTextMetaData
): PostWithOptionalTextMetaData => {
  if (isTextPost(post)) {
    const urlFromPost = getUrlFromTextPost(post)
    // eslint-disable-next-line functional/immutable-data,no-param-reassign
    post.url = urlFromPost ? urlFromPost : post.url
  } else {
    // eslint-disable-next-line functional/immutable-data,no-param-reassign
    post.isTextPostWithNoUrlsInPost = true
  }

  return post
}

const removeFailedDownloads = (items: (PostId | undefined | Error)[]): PostId[] | [] =>
  items.filter(R.allPass([isNotError, RA.isNotNil])) as PostId[] | []

// eslint-disable-next-line max-lines-per-function
function downloadPostsMedia(
  adminSettings: AdminSettings,
  postsMediaToBeDownloaded: DownloadsStore['postsMediaToBeDownloaded']
): Promise<PostId[] | []> {
  const postsArr = [...postsMediaToBeDownloaded.values()]

  adminMediaDownloadsViewerOrganiser.initializeWithNewPosts(postsArr)

  return Prray.from(postsArr)
    .mapAsync(
      // eslint-disable-next-line max-lines-per-function, complexity
      async (post: Post) => {
        if (tooManyDownloadTries(post)) {
          adminMediaDownloadsViewerOrganiser.setDownloadSkipped(
            post.id,
            'Download Skipped: Too many download tries (3).'
          )
          /*****
            We want to remove them here so we dont keep trying to download them in
            startSomeDownloads() in update-scheduler.
          *****/
          downloadsStore.postsMediaToBeDownloaded.delete(post.id)

          return
        }

        const thereAreSubsThatNeedUpdating = await db.thereAreSubsThatNeedUpdating()

        /*****
          We want to stop the media downloads here (by returning), if there are more/new subs to download posts for.
          E.g. what if a big session of media downloads start (like say media of 5000 posts) and a second
          user adds a subreddit. It would mean that user would have to wait for all of those 5000
          posts media downloads to complete first before they see any posts for subs they have added.
        *****/
        if (thereAreSubsThatNeedUpdating) {
          adminMediaDownloadsViewerOrganiser.clearAllDownloads()
          return
        }

        // eslint-disable-next-line functional/no-try-statement
        try {
          await db.incrementPostMediaDownloadTry(post.id)

          const postMediaFolder = await createMediaFolderForPost(post.id)

          const mediaDownload: MediaDownload = {
            post: setPostUrlToArticleInTextIfTextPost(post),
            adminSettings,
            postMediaFolder,
          }

          adminMediaDownloadsViewerOrganiser.setDownloadStarted(post.id)

          await downloadIndividualPostMedia(mediaDownload)

          adminMediaDownloadsViewerOrganiser.setDownloadSucceeded(post.id)

          await db.setMediaDownloadedTrueForPost(post.id)

          return post.id
        } catch (err) {
          //To appease the Typescript gods: https://github.com/microsoft/TypeScript/issues/20024
          const downloadError = err as Error

          adminMediaDownloadsViewerOrganiser.setDownloadFailed(post.id, downloadError)

          // Dont need a .catch here as isOffline does a .catch and returns true on error.
          const weAreOffline = await isOffline()

          if (weAreOffline) {
            // Roll this back if it was just an error from being offline
            await db.decrementPostMediaDownloadTry(post.id)
          }

          if (!weAreOffline) {
            /*****
              We need to remove them from downloadsStore when they error, otherwise it will loop forever
              as they are never removed from downloadsStore.
            *****/
            downloadsStore.postsMediaToBeDownloaded.delete(post.id)

            logDownloadError(downloadError, post)
          }

          return downloadError
        } finally {
          // Map doesnt error if the item isnt there when you try to delete it
          spawnedDownloadProcessReferences.delete(post.id)
          directDownloadReferences.delete(post.id)
        }
      },
      {
        concurrency: adminSettings.numberMediaDownloadsAtOnce,
      }
    )
    .then(removeFailedDownloads)
}

export { downloadPostsMedia }
