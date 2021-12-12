import execa from 'execa'
import * as R from 'ramda'
import RA from 'ramda-adjunct'

import type { Post } from '../../db/entities/Posts/Post'
import { mediaDownloadsLogger } from '../../logging/logging'
import { adminMediaDownloadsViewerOrganiser } from './media-downloads-viewer-organiser'

type PostReadyForDownload = Post & { isTextPostWithNoUrlsInPost?: boolean }

const twoHoursInMs = 7200000

// NA is what yt-dlp will add if the data is not available in the template.
const toNumber = (numAsString: string): number => (numAsString === 'NA' ? 0 : Number(numAsString))

/*****
  Sometimes we seem to get multiple updates in a single stdoutHandler, so we split on the
  carriage return as that seperates them. There is a carriage return at the start even when there is
  only one update, so this should work then too.
*****/
const bufferToUpdateData = (buffStr: string): number[][] =>
  buffStr
    .split('\r')
    .filter(RA.isNonEmptyString)
    .map((update: string): number[] => update.split('--').map(toNumber))

const stdoutHandler = R.curry((post: PostReadyForDownload, data: Buffer | string) => {
  /*****
    This is a little bit brittle, so putting it in a try/catch block.
  *****/
  // eslint-disable-next-line functional/no-try-statement
  try {
    const updates = bufferToUpdateData(data.toString())

    updates.forEach(([downloadFileSize, downloadedBytes, downloadSpeed]) => {
      adminMediaDownloadsViewerOrganiser.setDownloadProgress(
        post.id,
        downloadFileSize,
        downloadedBytes,
        downloadSpeed
      )
    })
  } catch (error) {
    mediaDownloadsLogger.trace(error)
  }
})

function spawnSubProcess(command: string, post: PostReadyForDownload, downloadType: string): Promise<void> {
  const subprocess = execa.command(command, {
    shell: true,
    cleanup: true,
    timeout: twoHoursInMs, // To kill any stalled downloads.
  })

  /*****
    There's really no need to do progress updates for image downloads as they only take about a second.
    Also, even though gallery-dl does have progress updates, it only has it for when you pass it multiple urls
    in the cli command so cant really do progress on individual post downloads anyway.
  *****/
  // eslint-disable-next-line functional/no-conditional-statement
  if (downloadType === 'video') {
    subprocess.stdout?.on('data', stdoutHandler(post))
  }

  return subprocess.then(RA.noop)
}

export { spawnSubProcess }
