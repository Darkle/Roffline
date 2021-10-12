import R from 'ramda'
import RA from 'ramda-adjunct'
import { compose } from 'ts-functional-pipe'
import { Post, PostMediaKey, Oembed } from '../../db/entities/Posts'

import { User } from '../../db/entities/Users'

/* eslint-disable security/detect-unsafe-regex */
const isDirectImageLink = R.test(/\.(png|jpe?g|gif|webp|svg|apng|avif|bmp|tiff?|heif|heic)(\?.*)?$/u)

const isDirectVideoLink = R.test(/\.(gifv|mpe?g|mp4|m4v|m4p|ogv|ogg|mov|mkv|webm)(\?.*)?$/u)

const isDirectFileLink = R.test(/\.(zip|pdf)(\?.*)?$/u)

// Reddit preview image urls need to be downloaded by gallery-dl
const isNotARedditPreviewUrl = R.complement(R.test(/^https:\/\/preview.redd.it/u))

type DownloadPostsData = {
  post: Post
  settings: User
  isScheduledUpdate: boolean
  postMediaFolder: string
}

const getPostProp = (downloadPostsData: DownloadPostsData | { post: Post }): Post => downloadPostsData.post
const hasSelfText = (post: Post): boolean => RA.isNonEmptyString(post.selftext)
const getPostUrlProp = (post: Post): string => post.url
const getPostHintProp = (post: Post): string => post.post_hint
const getPostDomainProp = (post: Post): string => post.domain

const isDirectMediaLink = compose(
  // prettier-ignore
  R.allPass([
    R.anyPass([isDirectImageLink, isDirectVideoLink, isDirectFileLink]),
    isNotARedditPreviewUrl
  ]),
  R.path(['post', 'url'])
)

const isTextPost = compose(R.allPass([R.propEq('is_self', true), hasSelfText]), R.prop('post'))

const isNotTextPost = (post: Post): boolean => !isTextPost({ post })

const isNotSelfPostWithNoText = R.complement(
  R.allPass([
    R.anyPass([
      compose(R.startsWith('https://www.reddit.com/r/'), getPostUrlProp),
      compose(R.startsWith('https://old.reddit.com/r/'), getPostUrlProp),
    ]),
    R.propEq('is_self', true),
    hasSelfText,
  ])
)

const doesNotStartWith = R.curry((text: string, str: string) => !R.startsWith(text, str))

const isNotRedditUrl = compose(
  R.allPass([
    compose(doesNotStartWith('https://www.reddit.com/r/'), getPostUrlProp),
    compose(doesNotStartWith('https://old.reddit.com/r/'), getPostUrlProp),
    compose(doesNotStartWith('/r/'), getPostUrlProp),
  ]),
  getPostProp
)

const isCrossPost = compose(
  R.allPass([
    R.anyPass([
      compose(R.startsWith('https://www.reddit.com/r/'), getPostUrlProp),
      compose(R.startsWith('https://old.reddit.com/r/'), getPostUrlProp),
      compose(R.startsWith('/r/'), getPostUrlProp),
      compose(RA.isNotNil, R.prop('crosspost_parent')),
    ]),
    // A self text post will have its own url as the url, so check its not just a text post.
    isNotTextPost,
    // e.g. https://www.reddit.com/r/AskReddit/comments/ozxi8w/
    isNotSelfPostWithNoText,
  ]),
  getPostProp
)

const isTextPostWithNoUrlInPost = R.pathSatisfies(
  isTextPostWithNoUrlsInPost => !!isTextPostWithNoUrlsInPost,
  ['post', 'isTextPostWithNoUrlsInPost']
)

type MediaObj = {
  oembed?: Oembed
}
/*****
  We use posts-media-categorizers when initially downloading posts (where media will be JSON as a string)
    and also in other places where the posts are already in the db (where media will be a JS object)
*****/
const isVideoEmbed = ({ media = {} }: { media: MediaObj | string }): boolean => {
  const mediaObj: MediaObj = typeof media === 'string' ? (JSON.parse(media) as PostMediaKey) : media

  return mediaObj?.oembed?.type === 'video'
}

const isOneOf = R.curry((domains: string[], domain: string) => domains.includes(domain))
/*****
  Sometimes the post_hint property isnt present immediately on a new post, so also check
  other properties.
*****/
const isVideoPost = compose(
  R.anyPass([
    compose(R.includes('video'), getPostHintProp),
    compose(
      isOneOf(['vm.tiktok.com', 'youtube.com', 'youtu.be', 'gfycat.com', 'giphy.com', 'v.redd.it']),
      getPostDomainProp
    ),
    isVideoEmbed,
  ]),
  getPostProp
)

const isNotVideoPost = (post: Post): boolean => !isVideoPost({ post })

const isImagePost = compose(
  R.anyPass([
    compose(R.includes('image'), getPostHintProp),
    compose(R.startsWith('https://www.reddit.com/gallery/'), getPostUrlProp),
    compose(R.startsWith('https://preview.redd.it'), getPostUrlProp),
    R.both(isNotVideoPost, R.pathEq(['domain'], 'imgur.com')),
  ]),
  getPostProp
)

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
}
