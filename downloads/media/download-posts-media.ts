import path from 'path'
import * as R from 'ramda'

import { AdminSettings } from '../../db/entities/AdminSettings'
import { Post } from '../../db/entities/Posts/Post'
import { getEnvFilePath, pCreateFolder } from '../../server/utils'
import { DownloadsStore } from '../downloads-store'
import { downloadDirectMediaLink } from './direct-media-download'
import {
  isDirectMediaLink,
  isCrossPost,
  isTextPost,
  isVideoPost,
  isImagePost,
  isTextPostWithNoUrlInPost,
  isNotRedditUrl,
} from './posts-media-categorizers'

type PostId = string

const postsMediaContainerFolder = getEnvFilePath(process.env['POSTS_MEDIA_DOWNLOAD_DIR'])
const maxNumberDownloadTriesAllowed = 3

const tooManyDownloadTries = (post: Post): boolean => post.mediaDownloadTries >= maxNumberDownloadTriesAllowed

const createMediaFolderForPost = (postId: string): Promise<string> => {
  const postMediaFolder = path.join(postsMediaContainerFolder, postId)

  return pCreateFolder(postMediaFolder).then(_ => postMediaFolder)
}

const downloadIndividualPostMedia = R.compose(
  // eslint-disable-next-line ramda/cond-simplification
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
    // [isTextPostWithNoUrlInPost, skipDownload('Is a text-post with no url in post')],
    // [isNotRedditUrl, saveWebPage],
    // /*****
    //  Ignore crossposts for now where the url links to another post (eg https://www.reddit.com/r/...)
    //  Leave the crossposts check towards the end of the checks as it is sometimes possible to download
    //   the video or image of a crosspost if the url is not a https://www.reddit.com/r/ url.
    // *****/
    // [isCrossPost, skipDownload('Is a cross-post with no direct download url')],
    // [R.T, skipDownload('No media match for download.')],
  ])
  // R.when(isTextPost, getUrlFromTextPost)
)

// eslint-disable-next-line max-lines-per-function
function downloadPostsMedia(
  adminSettings: AdminSettings,
  postsMediaToBeDownloaded: DownloadsStore['postsMediaToBeDownloaded']
): Promise<PostId[]> {
  const posts = [...postsMediaToBeDownloaded]

  return Prray.from(posts).forEachAsync(
    // eslint-disable-next-line max-lines-per-function
    async post => {
      // eslint-disable-next-line functional/no-conditional-statement
      if (tooManyDownloadTries(post)) {
        //TODO: What if rather than a download history, we had a postsMediaToBeDownloadedCache and we changed attributes on it and emitted events when we changed attributes - a proxy might be good here for emitting on gets/sets. So it would emit and that would trigger sending the update to the frontend via websockets
        addPostToDownloadsSkippedHistory(post, 'Failed to download this post url on at least 3 occasions.')
        return
      }

      await db.incrementPostMediaDownloadTry(post.id)

      const postMediaFolder = await createMediaFolderForPost(post.id)

      // eslint-disable-next-line functional/no-try-statement
      try {
        addPostToDownloadHistory(post)
        await downloadIndividualPostMedia({
          post,
          adminSettings,
          postMediaFolder,
        })

        await db.setMediaDownloadedTrueForPost(post.id)
        //TODO:set post in postsMediaToBeDownloadedCache to have finishedDownload:true
      } catch (err) {
        await logDownloadErrorIfNotOffline(err, post)
      }
    },
    {
      concurrency: settings.numberMediaDownloadsAtOnce,
    }
  )
  //TODO: .then(remove empty or errors and return postIds of successfull media downloads)
}

export { downloadPostsMedia }
