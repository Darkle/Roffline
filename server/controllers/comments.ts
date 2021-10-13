import { decode as decodeHTML } from 'html-entities'
import * as RA from 'ramda-adjunct'
import { DateTime } from 'luxon'
import jsAgo from 'js-ago'

import { CommentsContainer } from '../../db/entities/Comments'

const commentHasReplies = (comment: CommentsContainer): boolean => !!comment?.data?.replies

const getCommentReplies = (comment: CommentsContainer): CommentsContainer[] =>
  comment?.data?.replies?.data?.children

const commentNotEmpty = (comment: CommentsContainer): boolean => !!comment?.data?.body_html

const formatDateCreated = (comment: CommentsContainer): string =>
  DateTime.fromSeconds(comment?.data?.created_utc || 0).toFormat('yyyy LLL dd, h:mm a')

const commentHideShow = /*html*/ `<a href="#" x-on:click.prevent="commentOpen = !commentOpen" 
    title="hide/show comment tree" class="collapse-comment" 
    x-text="!!commentOpen ? '▽' : '▷'"></a>`

const author = (
  comment: CommentsContainer
): string => /*html*/ `<a href="https://www.reddit.com/u/${comment?.data?.author}" 
    class="comment-username">${comment?.data?.author}</a>`

const points = (comment: CommentsContainer): string =>
  /*html*/ `<data value="${comment?.data?.score}">${comment?.data?.score} points</data>`

const permalink = (comment: CommentsContainer): string => /*html*/ `
    <a href="https://www.reddit.com${comment?.data?.permalink}" title="${formatDateCreated(comment)}">
      <time datetime="${formatDateCreated(comment)}">
        ${jsAgo(comment?.data?.created_utc || 0)}
      </time>
    </a>`

const commentContent = (
  comment: CommentsContainer
): string => /*html*/ `<div class="comment-content" x-show="commentOpen === true">
  ${decodeHTML(comment?.data?.body_html)}
  </div>`

const childCommentsContainer = (childComments: string): string =>
  /*html*/ `<div class="child-comments" x-show="commentOpen === true">${childComments}</div>`

const moreCommentsToggle = /*html*/ `<a href="#" x-on:click.prevent="commentOpen = !commentOpen" 
    class="more-comments-toggle" x-show="commentOpen !== true">☰</a>`

function creatIndividualComment(comment: CommentsContainer, childComments: string): string {
  return /*html*/ `
    <li x-data="{ commentOpen: true }">
      <small class="comment-metadata">
        ${commentHideShow}
        ${author(comment)}
        ${points(comment)}
        ${permalink(comment)}
      </small>
      ${commentContent(comment)}
      ${childCommentsContainer(childComments)}
      ${moreCommentsToggle}
    </li>
  `
}

function createCommentsHtml(comments: CommentsContainer[]): string {
  return RA.isEmptyArray(comments)
    ? ''
    : /*html*/ `<ul>
  ${
    (comments as CommentsContainer[]).reduce((totalCommentsAsHtmlString: string, comment: CommentsContainer) => {
      const childComments: string = commentHasReplies(comment)
        ? createCommentsHtml(getCommentReplies(comment))
        : ''
      const moreComments: string = commentNotEmpty(comment) ? creatIndividualComment(comment, childComments) : ''

      return totalCommentsAsHtmlString + moreComments
    }, '') as string
  }
  </ul>`
}

export { createCommentsHtml }
