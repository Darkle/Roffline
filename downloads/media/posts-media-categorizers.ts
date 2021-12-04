import * as R from 'ramda'
import * as RA from 'ramda-adjunct'

import { Post, PostMediaKey, Oembed } from '../../db/entities/Posts/Post'
import {
  domainsToIgnoreForPdfGeneration,
  imageHostDomains,
  imgurDomains,
  redditDomains,
  videoHostDomains,
  videoHostUrls,
} from './domains'

type PostWithOptionalTextMetaData = Post & { isTextPostWithNoUrlsInPost?: boolean }

/* eslint-disable security/detect-unsafe-regex */
const isDirectImageLink = R.test(/\.(png|jpe?g|gif|webp|svg|apng|avif|bmp|tiff?|heif|heic)(\?.*)?$/u)
const isDirectVideoLink = R.test(/\.(gifv|mpe?g|mp4|m4v|m4p|ogv|ogg|mov|mkv|webm)(\?.*)?$/u)
const isDirectFileLink = R.test(/\.(zip|pdf)(\?.*)?$/u)

// Reddit preview image urls need to be downloaded by gallery-dl
const isNotARedditPreviewUrl = R.complement(R.test(/^https:\/\/preview.redd.it/u))
const hasSelfText = (post: PostWithOptionalTextMetaData): boolean => RA.isNonEmptyString(post.selftext)
const doesNotHaveSelfText = R.complement(hasSelfText)
const getPostUrlProp = (post: PostWithOptionalTextMetaData): string => post.url
const getPostDomainProp = (post: PostWithOptionalTextMetaData): string => post.domain
const isTextPost = R.allPass([R.propEq('is_self', true), hasSelfText])
const isNotTextPost = R.complement(isTextPost)
const isPinterestDomain = (post: PostWithOptionalTextMetaData): boolean =>
  R.test(/pinterest\.[\w.]+/u)(post.domain)

const crosspostParentPropNotNil = (post: PostWithOptionalTextMetaData): boolean =>
  RA.isNotNil(post.crosspost_parent)

const postUrlStartsWithOneOf =
  (urls: string[]) =>
  (post: PostWithOptionalTextMetaData): boolean =>
    urls.some((url: string): boolean => post.url.startsWith(url))

const postHintContains =
  (searchTerm: string) =>
  (post: PostWithOptionalTextMetaData): boolean =>
    typeof post.post_hint === 'string' ? post.post_hint.includes(searchTerm) : false

const postDomainIsOneOf =
  (domains: string[]) =>
  (post: Post): boolean =>
    domains.some((domain: string): boolean => post.domain === domain || post.domain.endsWith(`.${domain}`))

type MediaObj = {
  oembed?: Oembed
} | null

const isVideoEmbed = ({ media }: { media: MediaObj }): boolean => media?.oembed?.type === 'video'

/*****
  Sometimes the post_hint property isnt present immediately on a new post, so also check
  other properties too.
*****/
const isVideoPost = R.anyPass([
  isVideoEmbed,
  postDomainIsOneOf(videoHostDomains),
  postUrlStartsWithOneOf(videoHostUrls),
  postHintContains('video'),
])

const isNotVideoPost = R.complement(isVideoPost)

const isNotImgurImage = R.complement(postDomainIsOneOf(imgurDomains))

const isDirectMediaLink = R.compose(
  // prettier-ignore
  R.allPass([
    R.anyPass([isDirectImageLink, isDirectVideoLink, isDirectFileLink]),
    isNotARedditPreviewUrl,
    /*****
      We want to not download imgur images with direct download as sometimes they can redirect to the imgur web page
      if they are high traffic. So we leave it for the gallery-dl download to take care of it.
    *****/
    isNotImgurImage
  ]),
  getPostUrlProp
)

const isSelfPost = R.allPass([
  R.anyPass([
    R.compose(R.startsWith('https://www.reddit.com/r/'), getPostUrlProp),
    R.compose(R.startsWith('https://old.reddit.com/r/'), getPostUrlProp),
  ]),
  R.propEq('is_self', true),
])

const isNotSelfPostWithoutText = R.complement(R.allPass([isSelfPost, doesNotHaveSelfText]))

const isRedditUrl = R.anyPass([postDomainIsOneOf(redditDomains), R.compose(R.startsWith('/r/'), getPostUrlProp)])

const isNotRedditUrl = R.complement(isRedditUrl)

const isCrossPost = R.allPass([
  R.anyPass([isRedditUrl, crosspostParentPropNotNil]),
  // A self post with text will have its own url as the url, so check its not just a text post.
  isNotTextPost,
  // e.g. https://www.reddit.com/r/AskReddit/comments/ozxi8w/
  isNotSelfPostWithoutText,
])

const isTextPostWithNoUrlInPost = R.pathSatisfies(RA.isTrue, ['post', 'isTextPostWithNoUrlsInPost'])

/*****
  Sometimes the post_hint property isnt present immediately on a new post, so also check
  other properties too.
*****/
const isImagePost = R.allPass([
  R.anyPass([
    R.compose(R.startsWith('https://www.reddit.com/gallery/'), getPostUrlProp),
    R.compose(R.startsWith('https://preview.redd.it'), getPostUrlProp),
    postDomainIsOneOf(imageHostDomains),
    isPinterestDomain,
    postHintContains('image'),
  ]),
  isNotVideoPost,
])

const isNotDirectMediaLink = R.complement(isDirectMediaLink)
const isNotImagePost = R.complement(isImagePost)
const isNotTextPostWithNoUrlInPost = R.complement(isTextPostWithNoUrlInPost)
const domainIsNotOneOf = (post: PostWithOptionalTextMetaData): boolean =>
  !domainsToIgnoreForPdfGeneration.includes(getPostDomainProp(post))

const isArticleToSaveAsPdf = R.allPass([
  isNotRedditUrl,
  isNotDirectMediaLink,
  isNotImagePost,
  isNotVideoPost,
  isNotTextPostWithNoUrlInPost,
  domainIsNotOneOf,
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
  isNotVideoPost,
  isNotRedditUrl,
  isArticleToSaveAsPdf,
}
