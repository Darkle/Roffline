import { DateTime } from 'luxon'
import * as Vue from 'vue'
import { unescape } from 'html-escaper'

import { CommentContainer } from '../../../db/entities/Comments'
import { PostWithComments } from '../../../db/entities/Posts/Post'
import { genPrettyDateCreatedAgoFromUTC } from '../../../server/controllers/posts/pretty-date-created-ago'

type CommentsClosedStatus = Map<string, boolean>

const Comments = Vue.defineComponent({
  // Set name here so we can recursively use this component in its own template.
  name: 'comments',
  props: {
    comments: Object as Vue.PropType<PostWithComments['comments']>,
  },
  data() {
    return {
      commentsClosedStatus: new Map() as CommentsClosedStatus,
    }
  },
  created() {
    const { commentsClosedStatus } = this

    this.comments?.forEach(comment => {
      commentsClosedStatus.set(comment.data.id, false)
    })
  },
  methods: {
    genPrettyDateCreatedAgoFromUTC,
    unescapeHTML: unescape,
    hasChildComments(comment: CommentContainer) {
      return comment.data.replies?.data?.children?.length > 0
    },
    formatDateCreated(comment: CommentContainer) {
      return DateTime.fromSeconds(comment?.data?.created_utc || 0).toISO()
    },
    authorLink(comment: CommentContainer) {
      // encodeURI is in case its https://www.reddit.com/u/[deleted]
      return `https://www.reddit.com/u/${encodeURI(comment?.data?.author)}`
    },
    pluralisePostScore(score: number): string {
      return `${score} ${score === 1 ? 'point' : 'points'}`
    },
    commentPermalink(comment: CommentContainer) {
      return `https://www.reddit.com${comment?.data?.permalink}`
    },
    commentIsOpen(comment: CommentContainer): boolean {
      return !this.commentsClosedStatus.get(comment.data.id)
    },
    toggleHideShowComment(comment: CommentContainer): void {
      const commentClosedStatus = this.commentsClosedStatus.get(comment.data.id)
      this.commentsClosedStatus.set(comment.data.id, !commentClosedStatus)
    },
    commentHasBody(comment: CommentContainer): boolean {
      return !!comment?.data?.body_html
    },
  },
  template: /* html */ `
    <ul>
      <template v-for="comment in comments">
        <li data-comment-open="true" v-if="commentHasBody(comment)">
          <small class="comment-metadata">
            <a 
              href="#" 
              v-on:click.prevent="toggleHideShowComment(comment)" 
              title="hide/show comment tree" class="collapse-comment" 
              >{{commentIsOpen(comment) ? '▽' : '▷'}}
            </a>
            <a 
              v-bind:href="authorLink(comment)" 
              class="comment-username">{{comment?.data?.author}}</a>
            <data v-bind:value="comment?.data?.score">{{pluralisePostScore(comment?.data?.score)}}</data>
            <a v-bind:href="commentPermalink(comment)" title="Comment permalink">
              <time v-bind:datetime="formatDateCreated(comment)">
                {{genPrettyDateCreatedAgoFromUTC(comment?.data?.created_utc || 0)}}
              </time>
            </a>
          </small>
          <div class="comment-content" v-show="commentIsOpen(comment)" v-html="unescapeHTML(comment?.data?.body_html)">
          </div>
          <div class="child-comments" v-show="commentIsOpen(comment)" v-if="hasChildComments(comment)">
            <comments 
              v-bind:comments="comment.data.replies.data.children"
            ></comments>
          </div>
          <a 
            v-if="hasChildComments(comment)"
            href="#" 
            v-on:click.prevent="toggleHideShowComment(comment)" 
            class="more-comments-toggle" 
            v-show="!commentIsOpen(comment)"
            >☰</a>
        </li>
      </template>
    </ul>
`,
})

export { Comments }
