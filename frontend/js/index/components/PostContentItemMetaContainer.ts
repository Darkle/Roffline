import * as Vue from 'vue'

const PostContentItemMetaContainer = Vue.defineComponent({
  props: {
    subreddit: String,
    author: String,
    permalink: String,
    score: Number,
    prettyDateCreated: String,
    prettyDateCreatedAgo: String,
  },
  methods: {
    pluralisePostScore(score: number): string {
      return `${score} ${score === 0 || score > 1 ? 'points' : 'point'}`
    },
  },
  computed: {
    redditAuthorHref(): string {
      // encodeURI is in case its https://www.reddit.com/u/[deleted]
      return `https://www.reddit.com/u/${encodeURI(this.author || '')}`
    },
  },
  template: /* html */ `
  <small class="post-meta-container">
    <ul>
      <li>
        <data v-bind:value="score">{{ pluralisePostScore(score) }}</data>
      </li>
      <li>
        <span>from <a v-bind:href="'/sub/' + subreddit">/r/{{ subreddit }}</a></span>
      </li>
      <li class="submission-data">
        <span>submitted</span>
        <time v-bind:datetime="prettyDateCreated">{{ prettyDateCreatedAgo }}</time>
        <span>by</span>
        <a v-bind:href="redditAuthorHref">{{ author }}</a>
      </li>
      <li>
        <a
          v-bind:href="'https://www.reddit.com' + permalink"
          aria-label="Go to the original reddit url of this post"
          >original url</a>
      </li>
    </ul>
  </small>  
  `,
})

export { PostContentItemMetaContainer }
