import * as R from 'ramda'
import * as RA from 'ramda-adjunct'

import { Post, PostMediaKey, Oembed } from '../../db/entities/Posts/Post'

/* eslint-disable security/detect-unsafe-regex */
const isDirectImageLink = R.test(/\.(png|jpe?g|gif|webp|svg|apng|avif|bmp|tiff?|heif|heic)(\?.*)?$/u)
const isDirectVideoLink = R.test(/\.(gifv|mpe?g|mp4|m4v|m4p|ogv|ogg|mov|mkv|webm)(\?.*)?$/u)
const isDirectFileLink = R.test(/\.(zip|pdf)(\?.*)?$/u)

// Reddit preview image urls need to be downloaded by gallery-dl
const isNotARedditPreviewUrl = R.complement(R.test(/^https:\/\/preview.redd.it/u))
const hasSelfText = (post: Post): boolean => RA.isNonEmptyString(post.selftext)
const doesNotHaveSelfText = R.complement(hasSelfText)
const getPostUrlProp = (post: Post): string => post.url
const getPostHintProp = (post: Post): string => post.post_hint
const getPostDomainProp = (post: Post): string => post.domain
const crosspostParentPropNotNil = (post: Post): boolean => RA.isNotNil(post.crosspost_parent)
const isTextPost = R.allPass([R.propEq('is_self', true), hasSelfText])
const isNotTextPost = R.complement(isTextPost)

const isDirectMediaLink = R.compose(
  // prettier-ignore
  R.allPass([
    R.anyPass([isDirectImageLink, isDirectVideoLink, isDirectFileLink]),
    isNotARedditPreviewUrl
  ]),
  R.path(['post', 'url'])
)

const isSelfPost = R.allPass([
  R.anyPass([
    R.compose(R.startsWith('https://www.reddit.com/r/'), getPostUrlProp),
    R.compose(R.startsWith('https://old.reddit.com/r/'), getPostUrlProp),
  ]),
  R.propEq('is_self', true),
])

const isNotSelfPostWithoutText = R.complement(R.allPass([isSelfPost, doesNotHaveSelfText]))

const isRedditUrl = R.anyPass([
  R.compose(R.startsWith('https://www.reddit.com/r/'), getPostUrlProp),
  R.compose(R.startsWith('https://old.reddit.com/r/'), getPostUrlProp),
  R.compose(R.startsWith('/r/'), getPostUrlProp),
])

const isNotRedditUrl = R.complement(isRedditUrl)

const isCrossPost = R.allPass([
  R.anyPass([isRedditUrl, crosspostParentPropNotNil]),
  // A self post with text will have its own url as the url, so check its not just a text post.
  isNotTextPost,
  // e.g. https://www.reddit.com/r/AskReddit/comments/ozxi8w/
  isNotSelfPostWithoutText,
])

const isTextPostWithNoUrlInPost = R.pathSatisfies(RA.isTrue, ['post', 'isTextPostWithNoUrlsInPost'])

type MediaObj = {
  oembed?: Oembed
}
/*****
  We use posts-media-categorizers when initially downloading posts (where media will be JSON as a string).
  We also use posts-media-categorizers in other places where the posts are already in the db (where media will be a JS object)
*****/
const isVideoEmbed = ({ media = {} }: { media: MediaObj | string }): boolean => {
  // eslint-disable-next-line functional/no-try-statement
  try {
    const mediaObj: MediaObj = typeof media === 'string' ? (JSON.parse(media) as PostMediaKey) : media

    return mediaObj?.oembed?.type === 'video'
  } catch (error) {
    return false
  }
}

const isOneOf = R.curry((domains: string[], domain: string) => domains.includes(domain))

//TODO: this should be expanded
const videoHostDomains = ['vm.tiktok.com', 'youtube.com', 'youtu.be', 'gfycat.com', 'giphy.com', 'v.redd.it']

/*****
  Sometimes the post_hint property isnt present immediately on a new post, so also check
  other properties.
*****/
const isVideoPost = R.anyPass([
  R.compose(R.includes('video'), getPostHintProp),
  R.compose(isOneOf(videoHostDomains), getPostDomainProp),
  isVideoEmbed,
])

const isNotVideoPost = R.complement(isVideoPost)

const isImgurImage = R.both(isNotVideoPost, R.pathEq(['domain'], 'imgur.com'))

const isImagePost = R.anyPass([
  R.compose(R.includes('image'), getPostHintProp),
  R.compose(R.startsWith('https://www.reddit.com/gallery/'), getPostUrlProp),
  R.compose(R.startsWith('https://preview.redd.it'), getPostUrlProp),
  isImgurImage,
])

const isNotDirectMediaLink = R.complement(isDirectMediaLink)
const isNotImagePost = R.complement(isImagePost)
const isNotTextPostWithNoUrlInPost = R.complement(isTextPostWithNoUrlInPost)

const isArticleToSaveAsPdf = R.allPass([
  isNotRedditUrl,
  isNotDirectMediaLink,
  isNotImagePost,
  isNotVideoPost,
  isNotTextPostWithNoUrlInPost,
])

export {
  isDirectMediaLink,
  isDirectImageLink,
  isDirectVideoLink,
  isDirectFileLink,
  isNotARedditPreviewUrl,
  isCrossPost,
  isTextPost,
  isNotTextPost,
  isVideoPost,
  isImagePost,
  isTextPostWithNoUrlInPost,
  isVideoEmbed,
  isOneOf,
  isNotVideoPost,
  isNotRedditUrl,
  isArticleToSaveAsPdf,
}
