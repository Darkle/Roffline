import { DateTime } from 'luxon'
import * as Vue from 'vue'
import { unescape } from 'html-escaper'

import { CommentContainer } from '../../../db/entities/Comments'
import { PostWithComments } from '../../../db/entities/Posts/Post'
import { genPrettyDateCreatedAgoFromUTC } from '../../../server/controllers/posts/pretty-date-created-ago'

type CommentsThatAreClosed = Map<string, boolean>

const Comments = Vue.defineComponent({
  name: 'comments',
  props: {
    comments: Object as Vue.PropType<PostWithComments['comments']>,
  },
  data() {
    return {
      commentsThatAreClosed: new Map() as CommentsThatAreClosed,
    }
  },
  created() {
    const { commentsThatAreClosed } = this

    this.comments?.forEach(comment => {
      commentsThatAreClosed.set(comment.data.id, false)
    })
  },

  methods: {
    hasChildComments(comment: CommentContainer) {
      return comment.data.replies?.data?.children?.length > 0
    },
    formatDateCreated(comment: CommentContainer) {
      return DateTime.fromSeconds(comment?.data?.created_utc || 0).toISO()
    },
    genPrettyDateCreatedAgoFromUTC,
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
    unescapeHTML(escapedCommentHTML: string | undefined): string {
      return escapedCommentHTML ? unescape(escapedCommentHTML) : ''
    },
    commentIsOpen(comment: CommentContainer): boolean {
      return !this.commentsThatAreClosed.get(comment.data.id) as boolean
    },
    toggleHideShowComment(comment: CommentContainer): void {
      const commentIsClosed = this.commentsThatAreClosed.get(comment.data.id)
      this.commentsThatAreClosed.set(comment.data.id, !commentIsClosed)
    },
  },
  template: /* html */ `
    <ul>
      <template v-for="comment in comments">
        <li data-comment-open="true">
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
