import * as R from 'ramda'
import * as RA from 'ramda-adjunct'
import { decode } from 'html-entities'
import { compose } from 'ts-functional-pipe'

import { isCrossPost } from '../../../downloads/media/posts-media-categorizers'
import { Post } from '../../../db/entities/Posts/Post'

/* eslint-disable security/detect-unsafe-regex */
const containsImageFile = R.any(R.test(/\.(png|jpe?g|gif|webp|svg|apng|avif|bmp|tiff?|avif|heif|heic)(\?.*)?$/u))

const containsVideoFile = R.any(R.test(/\.(gifv|mpe?g|mp4|m4v|m4p|ogv|ogg|mov|mkv|webm)(\?.*)?$/u))

const containsHTMLFile = R.any(R.test(/.*\.(htm$|html$)/u))

const containsWebpageScreenshot = R.any(R.test(/^screenshot\.jpg$/u))

const doesNotcontainHTMLFile = R.complement(containsHTMLFile)

type PostWithDownloadedFiles = Post & { downloadedFiles: string[] }

const getDownloadedFilesProp = (post: PostWithDownloadedFiles): string[] => post.downloadedFiles

const getPostUrlProp = (post: Post): string => post.url

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

/*****
  Cant lazy-load gallery images as it messes with the carousel library. Most images are not gallery images though, so still
  see benifit in using lazy loading attr for single image.
*****/
// eslint-disable-next-line max-lines-per-function
const createImageGalleryHtml = ({
  downloadedFiles,
  id: postId,
  title,
}: {
  downloadedFiles: string[]
  id: string
  title: string
}): string =>
  downloadedFiles.length === 1
    ? /*html*/ `<div class="single-image"><img loading=lazy alt="Image for the post: ${title}" src="/posts-media/${postId}/${safeEncodeURIComponent(
        downloadedFiles[0]
      )}" /></div>`
    : /*html*/ `
  <div class="gallery-container">
    <div class="embla image-gallery gallery-postid-${postId}">
      <div class="embla__container">
        ${downloadedFiles.reduce(
          (acc, imageFile, index) => /*html*/ `${acc}<div class="embla__slide">
            <img alt="Image ${
              index + 1
            } for the post: ${title}" src="/posts-media/${postId}/${safeEncodeURIComponent(imageFile)}" />
            </div>`,
          ''
        )}
      </div>
    </div>
    <span class="gallery-icon" title="Swipe left/right to view gallery">⇄</span>  
  </div>
`

const createVideoHtml = ({
  downloadedFiles,
  id: postId,
}: {
  downloadedFiles: string[]
  id: string
}): string => /*html*/ `
  <video 
    class="video-postid-${postId}" 
    preload="auto" 
    controls 
    src="/posts-media/${postId}/${safeEncodeURIComponent(downloadedFiles[0])}">
    </video>
`

// eslint-disable-next-line max-lines-per-function
function createOfflineArticleLinks({
  downloadedFiles,
  id: postId,
}: {
  downloadedFiles: string[]
  id: string
}): string {
  const isHtmlFile = R.test(/.*\.(htm$|html$)/u)

  return /*html*/ `
    <div class="webpage-scrape-links-container">
    ${downloadedFiles.reduce(
      (acc, file) => /*html*/ `
          ${acc}
            <div class="offline-article-link">
              <span class="${isHtmlFile(file) ? 'html-offline-link' : ''}">${isHtmlFile(file) ? '⎋' : '※'}</span>
              
              <a href="/posts-media/${postId}/${safeEncodeURIComponent(file)}">
                ${isHtmlFile(file) ? 'Offline Article Link' : 'Screenshot Of Article'}
              </a>
            </div>`,
      ''
    )}
    </div>`
}

const createMediaPost = R.ifElse(
  compose(containsImageFile, getDownloadedFilesProp),
  createImageGalleryHtml,
  createVideoHtml
)

const createPostContentHtml = R.cond([
  [hasSelfTextHTMLSimpleCheck, compose(decode, getPostSelfTextProp)],
  [isACrossPost, constructATagUrl],
  [isScrapedArticle, createOfflineArticleLinks],
  [isInlineMediaPost, createMediaPost],
  [postHasUrl, constructATagUrl],
  [R.T, R.always('')],
])

export { createPostContentHtml }
