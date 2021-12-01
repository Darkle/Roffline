import { Post } from '../../db/entities/Posts/Post'
import { mediaDownloadsLogger } from '../../logging/logging'
import { isOffline } from '../check-if-offline'

/*****
  We want to log download errors, but only if they are errors unrelated to being offline.
*****/
async function logDownloadErrorIfNotOffline(err: Error, post: Post): Promise<void> {
  const weAreOffline = await isOffline()

  // eslint-disable-next-line functional/no-conditional-statement
  if (weAreOffline) return

  mediaDownloadsLogger.error(`Was unable to download media for post: https://www.reddit.com${post.permalink}`, {
    err,
    post,
  })
}

export { logDownloadErrorIfNotOffline }
