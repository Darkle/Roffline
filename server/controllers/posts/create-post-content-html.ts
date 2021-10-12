import R from 'ramda'
import RA from 'ramda-adjunct'
import { decode } from 'html-entities'

import { isCrossPost } from '../../../downloads/media/posts-media-categorizers'

/* eslint-disable security/detect-unsafe-regex */
const containsImageFile = R.any(R.test(/\.(png|jpe?g|gif|webp|svg|apng|avif|bmp|tiff?|avif|heif|heic)(\?.*)?$/u))

const containsVideoFile = R.any(R.test(/\.(gifv|mpe?g|mp4|m4v|m4p|ogv|ogg|mov|mkv|webm)(\?.*)?$/u))

const containsHTMLFile = R.any(R.test(/.*\.(htm$|html$)/u))

const containsWebpageScreenshot = R.any(R.test(/^screenshot\.jpg$/u))

const doesNotcontainHTMLFile = R.complement(containsHTMLFile)

const isScrapedArticle = R.compose(
  R.anyPass([containsHTMLFile, containsWebpageScreenshot]),
  R.prop('downloadedFiles')
)

const downloadedFilesAreMediaFiles = R.anyPass([containsImageFile, containsVideoFile])

const constructATagUrl = ({ url }) => `<a href="${url}">${url}</a>`

const isInlineMediaPost = R.compose(
  R.allPass([downloadedFilesAreMediaFiles, doesNotcontainHTMLFile, RA.isNonEmptyArray]),
  R.prop('downloadedFiles')
)

const hasSelfTextHTML_simple = R.compose(RA.isNotNil, R.prop('selftext_html'))

// The R.objOf('post') is to create {post}, as that is the parameter the post media categorizers need.
const isACrossPost = R.compose(isCrossPost, R.objOf('post'))

const postHasUrl = R.compose(RA.isNotNil, R.prop('url'))

/*****
  Cant lazy-load gallery images as it messes with the carousel library. Most images are not gallery images though, so still
  see benifit in using lazy loading attr for single image.
*****/
const createImageGalleryHtml = ({ downloadedFiles, id: postId, title }) =>
  downloadedFiles.length === 1
    ? /*html*/ `<div class="single-image"><img loading=lazy alt="Image for the post: ${title}" src="/posts-media/${postId}/${encodeURIComponent(
        downloadedFiles[0]
      )}" /></div>`
    : /*html*/ `
  <div class="gallery-container">
    <div class="embla image-gallery gallery-postid-${postId}">
      <div class="embla__container">
        ${downloadedFiles.reduce(
          (acc, imageFile, index) => /*html*/ `${acc}<div class="embla__slide">
            <img alt="Image ${index + 1} for the post: ${title}" src="/posts-media/${postId}/${encodeURIComponent(
            imageFile
          )}" />
            </div>`,
          ''
        )}
      </div>
    </div>
    <span class="gallery-icon" title="Swipe left/right to view gallery">⇄</span>  
  </div>
`

const createVideoHtml = ({ downloadedFiles, id: postId }) => /*html*/ `
  <video 
    class="video-postid-${postId}" 
    preload="auto" 
    controls 
    src="/posts-media/${postId}/${encodeURIComponent(downloadedFiles[0])}">
    </video>
`

function createOfflineArticleLinks({ downloadedFiles, id: postId }) {
  const isHtmlFile = R.test(/.*\.(htm$|html$)/u)

  return /*html*/ `
    <div class="webpage-scrape-links-container">
    ${downloadedFiles.reduce(
      (acc, file) => /*html*/ `
          ${acc}
            <div class="offline-article-link">
              <span class="${isHtmlFile(file) ? 'html-offline-link' : ''}">${isHtmlFile(file) ? '⎋' : '※'}</span>
              
              <a href="/posts-media/${postId}/${encodeURIComponent(file)}">
                ${isHtmlFile(file) ? 'Offline Article Link' : 'Screenshot Of Article'}
              </a>
            </div>`,
      ''
    )}
    </div>`
}

const createMediaPost = R.ifElse(
  R.compose(containsImageFile, R.prop('downloadedFiles')),
  createImageGalleryHtml,
  createVideoHtml
)

const createPostContentHtml = R.cond([
  [hasSelfTextHTML_simple, R.compose(decode, R.prop('selftext_html'))],
  [isACrossPost, constructATagUrl],
  [isScrapedArticle, createOfflineArticleLinks],
  [isInlineMediaPost, createMediaPost],
  [postHasUrl, constructATagUrl],
  [R.T, R.always('')],
])

module.exports = {
  createPostContentHtml,
}
