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

const skipDownload = R.curry((skipReason: string, { post }: { post: Post }) => {
  adminMediaDownloadsViewerOrganiser.setDownloadCancelled(post.id, skipReason)
  mediaDownloadsLogger.info(`Didn't download this post: ${skipReason}`, { ...post, skipReason })
})

const downloadIndividualPostMedia = R.compose(
  R.cond([
    [isDirectMediaLink, downloadDirectMediaLink],
    // [isImagePost, downloadImage],
    // [
    //   isVideoPost,
    //   R.ifElse(
    //     R.pathEq(['settings', 'downloadVideos'], true),
    //     downloadVideo,
    //     skipDownload('Video downloads disabled')
    //   ),
    // ],
    [isArticleToSaveAsPdf, savePageAsPdf],
    [isTextPostWithNoUrlInPost, skipDownload('Is a text-post with no url in post')],
    /*****
     Ignore crossposts for now where the url links to another post (eg https://www.reddit.com/r/...)
     Leave the crossposts check towards the end of the checks as it is sometimes possible to download
      the video or image of a crosspost if the url is not a https://www.reddit.com/r/ url.
    *****/
    [isCrossPost, skipDownload('Is a cross-post with no direct download url')],
    [R.T, skipDownload('No media match for download.')],
  ]),
  R.when(isTextPost, getUrlFromTextPost)
)

const removeFailedDownloads = (items: (PostId | undefined | Error)[]): PostId[] | [] =>
  items.filter(R.compose(isNotError, RA.isNotNil)) as PostId[] | []

// eslint-disable-next-line max-lines-per-function
function downloadPostsMedia(
  adminSettings: AdminSettings,
  postsMediaToBeDownloaded: DownloadsStore['postsMediaToBeDownloaded']
): Promise<PostId[] | []> {
  const postsArr = [...postsMediaToBeDownloaded.values()]

  adminMediaDownloadsViewerOrganiser.initializeWithNewPosts(postsArr)

  return Prray.from(postsArr)
    .mapAsync(
      // eslint-disable-next-line max-lines-per-function
      async (post: Post) => {
        // eslint-disable-next-line functional/no-conditional-statement
        if (tooManyDownloadTries(post)) {
          adminMediaDownloadsViewerOrganiser.setDownloadCancelled(
            post.id,
            'Download Skipped: Too many download tries (3).'
          )
          return
        }

        adminMediaDownloadsViewerOrganiser.incrementPostMediaDownloadTry(post.id)

        await db.incrementPostMediaDownloadTry(post.id)

        const postMediaFolder = await createMediaFolderForPost(post.id)

        // eslint-disable-next-line functional/no-try-statement
        try {
          adminMediaDownloadsViewerOrganiser.setDownloadStarted(post.id)

          const mediaDownload: MediaDownload = {
            post,
            adminSettings,
            postMediaFolder,
          }

          await downloadIndividualPostMedia(mediaDownload)

          adminMediaDownloadsViewerOrganiser.setDownloadSucceeded(post.id)

          await db.setMediaDownloadedTrueForPost(post.id)

          return post.id
        } catch (err) {
          //To appease the Typescript gods: https://github.com/microsoft/TypeScript/issues/20024
          const downloadError = err as Error

          adminMediaDownloadsViewerOrganiser.setDownloadFailed(post.id, downloadError)

          await logDownloadErrorIfNotOffline(downloadError, post)

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
