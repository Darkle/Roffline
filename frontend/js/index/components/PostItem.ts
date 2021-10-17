import * as Vue from 'vue'
import { FrontendPost } from '../../frontend-global-types'
import { PostContentItem } from './PostContent/PostContentItem'
import { PostContentItemMetaContainer } from './PostContentItemMetaContainer'

const PostItem = Vue.defineComponent({
  props: {
    post: Object as Vue.PropType<FrontendPost>,
    index: Number,
    onlyShowTitlesInFeed: Boolean,
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
      return `/post/${this.post?.id as string}`
    },
    pageSeperatorNumber(): string {
      const resultsPerPage = 30
      const index = this.index as number
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
          <a v-bind:href="postHref">{{ post.title }}</a>
        </h2>
        <post-content-item 
          v-bind:post="post"
          v-if="!onlyShowTitlesInFeed"
        ></post-content-item>
        <post-content-item-meta-container
          v-bind:post="post"
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
