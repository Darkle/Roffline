import path from 'path'
import Prray from 'prray'
import * as R from 'ramda'
import RA from 'ramda-adjunct'

import { db } from '../../db/db'
import { AdminSettings } from '../../db/entities/AdminSettings'
import { Post } from '../../db/entities/Posts/Post'
import { mediaDownloadsLogger } from '../../logging/logging'
import { getEnvFilePath, pCreateFolder, isNotError } from '../../server/utils'
import { DownloadsStore } from '../downloads-store'
import { downloadDirectMediaLink } from './direct-media-download'
import { savePageAsPdf } from './download-webpage'
import { getUrlFromTextPost } from './get-url-from-text-post'
import { logDownloadErrorIfNotOffline } from './log-download-errors'
import { adminMediaDownloadsViewerOrganiser } from './media-downloads-viewer-organiser'
import {
  isDirectMediaLink,
  isCrossPost,
  isTextPost,
  // isVideoPost,
  // isImagePost,
  isTextPostWithNoUrlInPost,
  isArticleToSaveAsPdf,
} from './posts-media-categorizers'

/* eslint-disable functional/no-conditional-statement */

type PostId = string

type MediaDownload = {
  post: Post & { isTextPostWithNoUrlsInPost?: boolean }
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

const skipDownload = (skipReason: string, post: Post): Promise<void> => {
  adminMediaDownloadsViewerOrganiser.setDownloadCancelled(post.id, skipReason)
  mediaDownloadsLogger.info(`Didn't download this post: ${skipReason}`, { ...post, skipReason })
  return Promise.resolve()
}

// eslint-disable-next-line max-lines-per-function,complexity
function downloadIndividualPostMedia({ post, adminSettings, postMediaFolder }: MediaDownload): Promise<void> {
  R.when(isTextPost, getUrlFromTextPost)
  if (isDirectMediaLink(post)) {
    return downloadDirectMediaLink(post, postMediaFolder)
  }

  // if (isImagePost(post)) {
  //   return downloadImage({ post, adminSettings, postMediaFolder })
  // }

  // if (isVideoPost(post)) {
  //   return R.ifElse(
  //     R.pathEq(['settings', 'downloadVideos'], true),
  //     downloadVideo,
  //     skipDownload('Video downloads disabled')
  //   )
  // }

  if (isArticleToSaveAsPdf(post)) {
    return savePageAsPdf({ post, adminSettings, postMediaFolder })
  }

  if (isTextPostWithNoUrlInPost(post)) {
    return skipDownload('Is a text-post with no url in post', post)
  }

  /*****
    Ignore crossposts for now where the url links to another post (eg https://www.reddit.com/r/...)
    Leave the crossposts check towards the end of the checks as it is sometimes possible to download
    the video or image of a crosspost if the url is not a https://www.reddit.com/r/ url.
  *****/
  if (isCrossPost(post)) {
    return skipDownload('Is a cross-post with no direct download url', post)
  }

  return skipDownload('No media match for download.', post)
}

const removeFailedDownloads = (items: (PostId | undefined | Error)[]): PostId[] | [] =>
  items.filter(R.compose(isNotError, RA.isNotNil)) as PostId[] | []

// eslint-disable-next-line max-lines-per-function
function downloadPostsMedia(
  adminSettings: AdminSettings,
  postsMediaToBeDownloaded: DownloadsStore['postsMediaToBeDownloaded']
): Promise<PostId[] | []> {
  const postsArr = [...postsMediaToBeDownloaded.values()]

  adminMediaDownloadsViewerOrganiser.initializeWithNewPosts(postsArr)

  debugger

  return Prray.from(postsArr)
    .mapAsync(
      // eslint-disable-next-line max-lines-per-function
      async (post: Post) => {
        if (tooManyDownloadTries(post)) {
          debugger
          adminMediaDownloadsViewerOrganiser.setDownloadCancelled(
            post.id,
            'Download Skipped: Too many download tries (3).'
          )
          return
        }

        debugger

        adminMediaDownloadsViewerOrganiser.incrementPostMediaDownloadTry(post.id)

        debugger

        await db.incrementPostMediaDownloadTry(post.id)

        debugger
        const postMediaFolder = await createMediaFolderForPost(post.id)

        debugger
        // eslint-disable-next-line functional/no-try-statement
        try {
          adminMediaDownloadsViewerOrganiser.setDownloadStarted(post.id)

          const mediaDownload: MediaDownload = {
            post,
            adminSettings,
            postMediaFolder,
          }

          debugger
          await downloadIndividualPostMedia(mediaDownload)

          debugger
          adminMediaDownloadsViewerOrganiser.setDownloadSucceeded(post.id)

          debugger
          await db.setMediaDownloadedTrueForPost(post.id)

          debugger
          return post.id
        } catch (err) {
          debugger
          //To appease the Typescript gods: https://github.com/microsoft/TypeScript/issues/20024
          const downloadError = err as Error

          debugger
          adminMediaDownloadsViewerOrganiser.setDownloadFailed(post.id, downloadError)

          debugger
          await logDownloadErrorIfNotOffline(downloadError, post)

          debugger
          return downloadError
        }
      },
      {
        concurrency: adminSettings.numberMediaDownloadsAtOnce,
      }
    )
    .then(removeFailedDownloads)
}

export { downloadPostsMedia }
