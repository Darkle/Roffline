import path from 'path'

import { chromium } from 'playwright'
import RA from 'ramda-adjunct'

import type { Post } from '../../db/entities/Posts/Post'

type PostWithOptionalTextMetaData = Post & { isTextPostWithNoUrlsInPost?: boolean }

const defaultPageWidth = 1280
const defaultPageHeight = 3000

const userAgentString =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36'

/*****
  Originally I was just creating a new context.newPage() for each page as that uses less resources, but
  the problem with that approach is it doesnt work too well with concurrency. For example, if one of the
  savePageAsPdf calls in a concurrency batch errors and closes the `browser`, then the other savePageAsPdf
  calls left in the batch will have a `browser` that has now been closed. I tried returning the savePageAsPdf
  function (effectively running it again) if that 'Target page, context or browser has been closed' error occured,
  but it still didnt work, so switched to just launching and closing the browser for each call. It uses up more cpu,
  but I have no other solution.
*****/
// eslint-disable-next-line max-lines-per-function
async function savePageAsPdf(post: PostWithOptionalTextMetaData, postMediaFolder: string): Promise<void> {
  const browser = await chromium.launch()
  // eslint-disable-next-line functional/no-try-statement
  try {
    const page = await browser.newPage({
      userAgent: userAgentString,
      viewport: {
        width: defaultPageWidth,
        height: defaultPageHeight,
      },
    })
    /*****
      `waitUntil: 'networkidle'` is not always reliable, so when it times out waiting for 'networkidle', we only let it throw
        when then page _hasn't_ also loaded.
      E.G.: https://www.solidjs.com/ seems to be a page that will load fine but will not trigger 'networkidle', dunno why - it
        seems to stop loading ok in chrome devtools.
    *****/
    // eslint-disable-next-line functional/no-let
    let pageLoaded = false

    page.on('load', () => {
      pageLoaded = true
    })

    // eslint-disable-next-line functional/no-try-statement
    try {
      await page.goto(post.url, { waitUntil: 'networkidle' })
    } catch (error) {
      // eslint-disable-next-line functional/no-conditional-statement
      if (!pageLoaded) {
        // eslint-disable-next-line functional/no-throw-statement
        throw error
      }
    }

    await page.pdf({ path: path.join(postMediaFolder, 'article.pdf') })
  } catch (err) {
    return Promise.reject(err)
  } finally {
    browser?.close?.().catch?.(RA.noop)
  }
}

export { savePageAsPdf }
