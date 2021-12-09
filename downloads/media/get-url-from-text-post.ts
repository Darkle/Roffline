import getUrls from 'get-urls'
import * as R from 'ramda'

import type { Post } from '../../db/entities/Posts/Post'

/*****
  If the post uses markdown in the selftext, the url will end up something like this:
    https://medium.com/the-innovation/10-scientific-methods-to-dramatically-improve-your-memory-68cd598fe3f0](https://medium.com/the-innovation/10-scientific-methods-to-dramatically-improve-your-memory-68cd598fe3f0)
  So we need to fix that.
*****/
const fixMarkdownUrls = (url: string): string =>
  /\]\(https?/gu.test(url) ? (url.split('](http')[0] as string) : url

const getLinkUrlFromSelfText = ({ selftext }: Post): string[] | [] =>
  Array.from(
    getUrls(selftext, {
      requireSchemeOrWww: true,
      exclude: [
        'http://reddit.com',
        'https://reddit.com',
        'http://www.reddit.com',
        'https://www.reddit.com',
        'http://old.reddit.com',
        'https://old.reddit.com',
        'http://redd.it',
        'https://redd.it',
      ],
    })
  ).map(fixMarkdownUrls)

/*****
  Only getting the first url in the text for the moment.
*****/
function getUrlFromTextPost(post: Post): null | string {
  const urlsInPostText = getLinkUrlFromSelfText(post)

  return R.isEmpty(urlsInPostText) ? null : (R.head(urlsInPostText) as string)
}

export { getUrlFromTextPost }
