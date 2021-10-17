import * as Vue from 'vue'
import { FrontendPost } from '../../frontend-global-types'

const PostContentItemMetaContainer = Vue.defineComponent({
  props: {
    post: Object as Vue.PropType<FrontendPost>,
  },
  methods: {
    pluralisePostScore(score: number): string {
      return `${score} ${score === 0 || score > 1 ? 'points' : 'point'}`
    },
  },
  computed: {
    redditAuthorHref(): string {
      // encodeURI is in case its https://www.reddit.com/u/[deleted]
      return `https://www.reddit.com/u/${encodeURI(this.post?.author as string)}`
    },
  },
  template: /* html */ `
  <small class="post-meta-container">
    <ul>
      <li>
        <data v-bind:value="post.score">{{ pluralisePostScore(post.score) }}</data>
      </li>
      <li>
        <span>from <a v-bind:href="'/sub/' + post.subreddit">/r/{{ post.subreddit }}</a></span>
      </li>
      <li class="submission-data">
        <span>submitted</span>
        <time v-bind:datetime="post.prettyDateCreated">{{ post.prettyDateCreatedAgo }}</time>
        <span>by</span>
        <a v-bind:href="redditAuthorHref">{{ post.author }}</a>
      </li>
      <li>
        <a
          v-bind:href="'https://www.reddit.com' + post.permalink"
          aria-label="Go to the original reddit url of this post"
          >original url</a>
      </li>
    </ul>
  </small>  
  `,
})

export { PostContentItemMetaContainer }
