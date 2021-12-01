import path from 'path'

import { chromium, Browser } from 'playwright'
import RA from 'ramda-adjunct'

import { AdminSettings } from '../../db/entities/AdminSettings'
import { Post } from '../../db/entities/Posts/Post'

type MediaDownload = {
  post: Post & { isTextPostWithNoUrlsInPost?: boolean }
  adminSettings: AdminSettings
  postMediaFolder: string
}

const defaultPageWidth = 1280
const defaultPageHeight = 3000

const userAgentString =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36'

// eslint-disable-next-line functional/no-let
let browser: Browser | null

// eslint-disable-next-line max-lines-per-function
async function savePageAsPdf({ postMediaFolder, post }: MediaDownload): Promise<void> {
  debugger
  // eslint-disable-next-line functional/no-try-statement
  try {
    // eslint-disable-next-line functional/no-conditional-statement
    if (!browser) {
      // eslint-disable-next-line require-atomic-updates
      browser = await chromium.launch()
    }

    const context = await browser.newContext({ userAgent: userAgentString })

    const page = await context.newPage()

    await page.goto(post.url, { waitUntil: 'networkidle' })

    await page.setViewportSize({
      width: defaultPageWidth,
      height: defaultPageHeight,
    })

    await page.pdf({ path: path.join(postMediaFolder, 'article.pdf') })

    debugger
    page.close()
  } catch (err) {
    await browser?.close?.().catch?.(RA.noop)
    return Promise.reject(err)
  }
}

export { savePageAsPdf }
