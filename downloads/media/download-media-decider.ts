import * as R from 'ramda'
import { AdminSettings } from '../../db/entities/AdminSettings'

import { Post } from '../../db/entities/Posts/Post'
import { mediaDownloadsLogger } from '../../logging/logging'
import { downloadDirectMediaLink } from './direct-media-download'
import { savePageAsPdf } from './download-webpage'
import { getUrlFromTextPost } from './get-url-from-text-post'
import { adminMediaDownloadsViewerOrganiser } from './media-downloads-viewer-organiser'
import {
  isArticleToSaveAsPdf,
  isCrossPost,
  isDirectMediaLink,
  // isImagePost,
  isTextPost,
  isTextPostWithNoUrlInPost,
  // isVideoPost,
} from './posts-media-categorizers'

type MediaDownload = {
  post: Post & { isTextPostWithNoUrlsInPost?: boolean }
  adminSettings: AdminSettings
  postMediaFolder: string
}

const skipDownload = (skipReason: string, post: Post): Promise<void> => {
  adminMediaDownloadsViewerOrganiser.setDownloadCancelled(post.id, skipReason)
  mediaDownloadsLogger.info(`Didn't download this post: ${skipReason}`, { ...post, skipReason })
  return Promise.resolve()
}

/* eslint-disable functional/no-conditional-statement,max-lines-per-function,complexity */

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
  //     skipDownload('Video downloads disabled', post)
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

export { downloadIndividualPostMedia }
