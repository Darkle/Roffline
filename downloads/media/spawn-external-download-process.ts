import { execaCommand } from 'execa'
import * as R from 'ramda'
import RA from 'ramda-adjunct'

import type { Post } from '../../db/entities/Posts/Post'

type PostReadyForDownload = Post & { isTextPostWithNoUrlsInPost?: boolean }

const twoHoursInMs = 7200000

// const fixYoutubeDLOutput = R.replace(`\r[`, ' [')

const stdoutHandler = R.curry((post: PostReadyForDownload, data: Buffer | string) => {
  console.log('Data for postId:', post.id)
  console.log(data.toString())
  // const downloadUpdate = data.toString()
  // const updateMessage = `[${downloadType}] ${downloadUpdate} (downloadUrl: ${post.url}, postUrl: https://www.reddit.com${post.permalink})`
})

function spawnSubProcess(command: string, post: PostReadyForDownload, downloadType: string): Promise<void> {
  const subprocess = execaCommand(command, {
    shell: true,
    cleanup: true,
    timeout: twoHoursInMs, // To kill any stalled downloads.
  })

  /*****
    Theres really no need to do progress updates for image downloads as they only take about a second.
    Also, even though gallery-dl does have progress updates, it only has it for when you pass it multiple urls
    in the cli command so cant really do progress on individual post downloads anyway.
  *****/
  // eslint-disable-next-line functional/no-conditional-statement
  if (downloadType === 'video') {
    subprocess.stdout?.on('data', stdoutHandler(post))
    // subprocess.stderr?.on('data', stdoutHandler(post))
  }

  return subprocess.then(RA.noop)
}

export { spawnSubProcess }
