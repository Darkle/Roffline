import { StatusCodes as HttpStatusCode } from 'http-status-codes'

import type { Post } from '../../db/entities/Posts/Post'
import { mediaDownloadsLogger } from '../../logging/logging'

type ResponseError = Error & { status?: number; body?: string }

const genErrMessage = (permalink: string): string =>
  `Was unable to download media for post: https://www.reddit.com${permalink}`

/*****
  We want to log download errors, but only if they are errors unrelated to being offline.
  Also, we dont really need to log 404 not found errors as there will be lots of missing
   links (eg images that have been deleted).
*****/
function logDownloadError(err: ResponseError, post: Post): void {
  // eslint-disable-next-line functional/no-conditional-statement
  if (err?.status === HttpStatusCode.NOT_FOUND) {
    mediaDownloadsLogger.trace(genErrMessage(post.permalink), { err, post })
  } else {
    mediaDownloadsLogger.error(genErrMessage(post.permalink), { err, post })
  }
}

export { logDownloadError }
