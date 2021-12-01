import getUrls from 'get-urls'
import * as R from 'ramda'

import { AdminSettings } from '../../db/entities/AdminSettings'
import { Post } from '../../db/entities/Posts/Post'

type MediaDownload = {
  post: Post & { isTextPostWithNoUrlsInPost?: boolean }
  adminSettings: AdminSettings
  postMediaFolder: string
}

/*****
  If the post uses markdown in the selftext, the url will end up something like this:
    https://medium.com/the-innovation/10-scientific-methods-to-dramatically-improve-your-memory-68cd598fe3f0](https://medium.com/the-innovation/10-scientific-methods-to-dramatically-improve-your-memory-68cd598fe3f0)
  So we need to fix that.
*****/
const fixMarkdownUrls = (url: string): string =>
  /\]\(https?/gu.test(url) ? (url.split('](http')[0] as string) : url

const getLinkUrlFromSelfText = ({ post: { selftext } }: MediaDownload): string[] | [] =>
  Array.from(
    // I dont know why typescript thinks getUrls is an any call
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    getUrls(selftext, {
      requireSchemeOrWww: true,
      exclude: [
        'http://reddit.com',
        'https://reddit.com',
        'http://www.reddit.com',
        'https://www.reddit.com',
        'http://old.reddit.com',
        'https://old.reddit.com',
      ],
    })
  ).map(fixMarkdownUrls)

/*****
  Only getting the first url in the text for the moment.
*****/
function getUrlFromTextPost(downloadMediaInfo: MediaDownload): MediaDownload {
  const urlsInPostText = getLinkUrlFromSelfText(downloadMediaInfo)

  // eslint-disable-next-line functional/no-conditional-statement
  if (R.isEmpty(urlsInPostText)) {
    // eslint-disable-next-line functional/immutable-data,no-param-reassign
    downloadMediaInfo.post.isTextPostWithNoUrlsInPost = true
  } else {
    // eslint-disable-next-line functional/immutable-data,no-param-reassign
    downloadMediaInfo.post.url = R.head(urlsInPostText) as string
  }

  return downloadMediaInfo
}

export { getUrlFromTextPost }
