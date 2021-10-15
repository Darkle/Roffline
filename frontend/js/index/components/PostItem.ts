import * as Vue from 'vue'
import { PostContentItem } from './PostContent/PostContentItem'
import { PostContentItemMetaContainer } from './PostContentItemMetaContainer'

const PostItem = Vue.defineComponent({
  props: {
    id: String,
    title: String,
    index: Number,
    onlyShowTitlesInFeed: Boolean,
    subreddit: String,
    author: String,
    permalink: String,
    score: Number,
    prettyDateCreated: String,
    prettyDateCreatedAgo: String,
    downloadedFiles: Array as Vue.PropType<string[]>,
    volume: Number,
  },
  methods: {
    shouldShowPageSeperator() {
      return true
    },
  },
  components: {
    PostContentItem,
    PostContentItemMetaContainer,
  },
  computed: {
    postHref(): string {
      return `/post/${this.id || ''}`
    },
    pageSeperatorNumber(): string {
      const resultsPerPage = 30
      const index = this.index || 0
      return `${(index + 1) / resultsPerPage + 1}`
    },
  },
  mounted() {
    //TODO: so we would do intersection observer here for the 3rd last post - so the 27th post, or less if there are less posts - aka 3rd from last.
    // this.$nextTick(function () {
    //   // Code that will run only after the
    //   // entire view has been rendered
    // })
  },
  template: /* html */ `
    <div class="post-container">
      <article>
        <h2>
          <a v-bind:href="postHref">{{ title }}</a>
        </h2>
        <post-content-item 
          v-bind:volume="volume"
          v-if="!onlyShowTitlesInFeed"
        ></post-content-item>
        <post-content-item-meta-container
          v-bind:subreddit="subreddit"
          v-bind:author="author"
          v-bind:permalink="permalink"
          v-bind:score="score"
          v-bind:pretty-date-created="prettyDateCreated"
          v-bind:pretty-date-created-ago="prettyDateCreatedAgo"
        ></post-content-item-meta-container>
      </article>
      <div class="page-seperator" v-if="shouldShowPageSeperator(index)">
        <hr />
        <h4 class="page-seperator">Page {{ pageSeperatorNumber }}</h4>
        <hr />
      </div>
    </div>    
    `,
})

export { PostItem }
