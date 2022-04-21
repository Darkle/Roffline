import type { AdminSettings } from '../../db/entities/AdminSettings'

import type { Post } from '../../db/entities/Posts/Post'
import { mediaDownloadsLogger } from '../../logging/logging'
import { downloadDirectMediaLink } from './direct-media-download'
import { savePageAsPdf } from './download-webpage'
import { downloadImage } from './download-image'
import { downloadVideo } from './download-video'
import { adminMediaDownloadsViewerOrganiser } from './media-downloads-viewer-organiser'
import {
  isArticleToSaveAsPdf,
  isCrossPost,
  isDirectMediaLink,
  isImagePost,
  isTextPostWithNoUrlInPost,
  isVideoPost,
} from './posts-media-categorizers'

type PostReadyForDownload = Post & { isTextPostWithNoUrlsInPost?: boolean }

type MediaDownload = {
  post: PostReadyForDownload
  adminSettings: AdminSettings
  postMediaFolder: string
}

const skipDownload = (skipReason: string, post: PostReadyForDownload): Promise<void> => {
  adminMediaDownloadsViewerOrganiser.setDownloadSkipped(post.id, skipReason)
  mediaDownloadsLogger.trace(`Didn't download this post: ${skipReason}`, { ...post, skipReason })
  return Promise.resolve()
}

/* eslint-disable functional/no-conditional-statement,max-lines-per-function,complexity */

function downloadIndividualPostMedia({ post, adminSettings, postMediaFolder }: MediaDownload): Promise<void> {
  if (isDirectMediaLink(post)) {
    return downloadDirectMediaLink(post, adminSettings, postMediaFolder)
  }

  if (isImagePost(post)) {
    return adminSettings.downloadImages
    ? downloadImage(post, adminSettings, postMediaFolder)
    : skipDownload('Image downloads disabled', post)
  }

  if (isVideoPost(post)) {
    return adminSettings.downloadVideos
      ? downloadVideo(post, adminSettings, postMediaFolder)
      : skipDownload('Video downloads disabled', post)
  }

  if (isArticleToSaveAsPdf(post)) {
    return adminSettings.downloadArticles
    ? savePageAsPdf(post, postMediaFolder)
      : skipDownload('Article downloads disabled', post)
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
