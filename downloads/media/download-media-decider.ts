import { AdminSettings } from '../../db/entities/AdminSettings'

import { Post } from '../../db/entities/Posts/Post'
import { mediaDownloadsLogger } from '../../logging/logging'
import { downloadDirectMediaLink } from './direct-media-download'
import { savePageAsPdf } from './download-webpage'
import { adminMediaDownloadsViewerOrganiser } from './media-downloads-viewer-organiser'
import {
  isArticleToSaveAsPdf,
  isCrossPost,
  isDirectMediaLink,
  isImagePost,
  isTextPostWithNoUrlInPost,
  isVideoPost,
} from './posts-media-categorizers'

type MediaDownload = {
  post: Post & { isTextPostWithNoUrlsInPost?: boolean }
  adminSettings: AdminSettings
  postMediaFolder: string
}

const skipDownload = (skipReason: string, post: Post): Promise<void> => {
  adminMediaDownloadsViewerOrganiser.setDownloadCancelled(post.id, skipReason)
  mediaDownloadsLogger.trace(`Didn't download this post: ${skipReason}`, { ...post, skipReason })
  return Promise.resolve()
}

/* eslint-disable functional/no-conditional-statement,max-lines-per-function,complexity */

function downloadIndividualPostMedia({ post, postMediaFolder }: MediaDownload): Promise<void> {
  debugger
  if (isDirectMediaLink(post)) {
    debugger
    return downloadDirectMediaLink(post, postMediaFolder)
  }

  debugger

  if (isImagePost(post)) {
    debugger
    return Promise.resolve()
    // return downloadImage({ post, adminSettings, postMediaFolder })
  }

  debugger

  if (isVideoPost(post)) {
    debugger
    return Promise.resolve()
    // return adminSettings.downloadVideos
    //   ? downloadVideo(post, adminSettings, postMediaFolder)
    //   : skipDownload('Video downloads disabled', post)
  }

  debugger

  if (isArticleToSaveAsPdf(post)) {
    debugger
    return savePageAsPdf(post, postMediaFolder)
  }

  debugger

  if (isTextPostWithNoUrlInPost(post)) {
    debugger
    return skipDownload('Is a text-post with no url in post', post)
  }

  debugger
  /*****
    Ignore crossposts for now where the url links to another post (eg https://www.reddit.com/r/...)
    Leave the crossposts check towards the end of the checks as it is sometimes possible to download
    the video or image of a crosspost if the url is not a https://www.reddit.com/r/ url.
  *****/
  if (isCrossPost(post)) {
    debugger
    return skipDownload('Is a cross-post with no direct download url', post)
  }

  debugger
  return skipDownload('No media match for download.', post)
}

export { downloadIndividualPostMedia }
