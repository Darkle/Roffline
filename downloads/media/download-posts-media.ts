import path from 'path'
import Prray from 'prray'
import * as R from 'ramda'
import RA from 'ramda-adjunct'

import { db } from '../../db/db'
import { AdminSettings } from '../../db/entities/AdminSettings'
import { Post } from '../../db/entities/Posts/Post'
import { getEnvFilePath, pCreateFolder, isNotError } from '../../server/utils'
import { DownloadsStore } from '../downloads-store'
import { downloadIndividualPostMedia } from './download-media-decider'
import { getUrlFromTextPost } from './get-url-from-text-post'
import { logDownloadErrorIfNotOffline } from './log-download-errors'
import { adminMediaDownloadsViewerOrganiser } from './media-downloads-viewer-organiser'
import { isTextPost } from './posts-media-categorizers'

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

const setPostUrlToArticleInTextIfTextPost = (
  post: PostWithOptionalTextMetaData
): PostWithOptionalTextMetaData => {
  // eslint-disable-next-line functional/no-conditional-statement
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
  items.filter(R.compose(isNotError, RA.isNotNil)) as PostId[] | []

// eslint-disable-next-line max-lines-per-function
function downloadPostsMedia(
  adminSettings: AdminSettings,
  postsMediaToBeDownloaded: DownloadsStore['postsMediaToBeDownloaded']
): Promise<PostId[] | []> {
  const postsArr = [...postsMediaToBeDownloaded.values()]

  console.log(adminMediaDownloadsViewerOrganiser)

  adminMediaDownloadsViewerOrganiser.initializeWithNewPosts(postsArr)

  debugger

  return Prray.from(postsArr)
    .mapAsync(
      // eslint-disable-next-line max-lines-per-function
      async (post: Post) => {
        // eslint-disable-next-line functional/no-conditional-statement
        if (tooManyDownloadTries(post)) {
          debugger
          adminMediaDownloadsViewerOrganiser.setDownloadCancelled(
            post.id,
            'Download Skipped: Too many download tries (3).'
          )
          return
        }

        console.log(`https://www.reddit.com${post.permalink}`)

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
            post: setPostUrlToArticleInTextIfTextPost(post),
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
        concurrency: 1,
      }
    )
    .then(removeFailedDownloads)
}

export { downloadPostsMedia }
