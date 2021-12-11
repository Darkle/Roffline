import execa from 'execa'
import * as R from 'ramda'
import RA from 'ramda-adjunct'

import type { Post } from '../../db/entities/Posts/Post'

type PostReadyForDownload = Post & { isTextPostWithNoUrlsInPost?: boolean }

const twoHoursInMs = 7200000

const stdoutHandler = R.curry((post: PostReadyForDownload, data: Buffer | string) => {
  console.log('Data for postId:', post.id)
  console.log(data.toString())
})

function spawnSubProcess(command: string, post: PostReadyForDownload, downloadType: string): Promise<void> {
  const subprocess = execa.command(command, {
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
  }

  return subprocess.then(RA.noop)
}

export { spawnSubProcess }
