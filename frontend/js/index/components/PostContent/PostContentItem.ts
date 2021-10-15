import * as Vue from 'vue'
import * as R from 'ramda'
import * as RA from 'ramda-adjunct'
import { compose } from 'ts-functional-pipe'

// import { isCrossPost } from '../../../downloads/media/posts-media-categorizers'
import { Post } from '../../../../../db/entities/Posts/Post'

const getPostUrlProp = (post: Post): string => post.url

const hasSelfText = (post: Post): boolean => RA.isNonEmptyString(post.selftext)

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
  ])
)

/* eslint-disable security/detect-unsafe-regex */
const containsImageFile = R.any(R.test(/\.(png|jpe?g|gif|webp|svg|apng|avif|bmp|tiff?|avif|heif|heic)(\?.*)?$/u))

const containsVideoFile = R.any(R.test(/\.(gifv|mpe?g|mp4|m4v|m4p|ogv|ogg|mov|mkv|webm)(\?.*)?$/u))

const containsHTMLFile = R.any(R.test(/.*\.(htm$|html$)/u))

const containsWebpageScreenshot = R.any(R.test(/^screenshot\.jpg$/u))

const doesNotcontainHTMLFile = R.complement(containsHTMLFile)

type PostWithDownloadedFiles = Post & { downloadedFiles: string[] }

const getDownloadedFilesProp = (post: PostWithDownloadedFiles): string[] => post.downloadedFiles

const getPostSelfTextProp = (post: Post): string => post.selftext_html

const isScrapedArticle = compose(R.anyPass([containsHTMLFile, containsWebpageScreenshot]), getDownloadedFilesProp)

const downloadedFilesAreMediaFiles = R.anyPass([containsImageFile, containsVideoFile])

const constructATagUrl = ({ url }: { url: string }): string => `<a href="${url}">${url}</a>`

const isInlineMediaPost = compose(
  R.allPass([downloadedFilesAreMediaFiles, doesNotcontainHTMLFile, RA.isNonEmptyArray]),
  getDownloadedFilesProp
)

const hasSelfTextHTMLSimpleCheck = compose(RA.isNotNil, getPostSelfTextProp)

// The R.objOf('post') is to create {post}, as that is the parameter the post media categorizers need.
const isACrossPost = compose(isCrossPost, R.objOf('post'))

const postHasUrl = compose(RA.isNotNil, getPostUrlProp)

const safeEncodeURIComponent = (str: string | undefined): string => encodeURIComponent(str || '')

const PostContentItem = Vue.defineComponent({
  props: {
    id: String,
    title: String,
    downloadedFiles: [String],
  },
  template: /* html */ `<div class="post-content">
</div>

  </div>`,
})

export { PostContentItem }
