import * as Vue from 'vue'
import { unescape } from 'html-escaper'

import { FrontendPost } from '../../frontend-global-types'
import { PostContentItem } from './PostContent/PostContentItem'
import { PostContentItemMetaContainer } from './PostContentItemMetaContainer'
import { User } from '../../../../db/entities/Users/User'
import { Fetcher } from '../../frontend-utils'

const postsPerPage = 30
const page = Vue.ref(1)

const PostItem = Vue.defineComponent({
  props: {
    post: Object as Vue.PropType<FrontendPost>,
    index: Number,
    postsLength: Number,
    userSettings: Object as Vue.PropType<User>,
    totalResults: Number,
  },
  methods: {
    shouldShowPageSeperator() {
      const totalResults = this.totalResults as number
      const infiniteScrollEnabled = this.userSettings?.infiniteScroll
      const postIndexIsMultipleOf30 = this.getNonZeroIndex() % postsPerPage === 0

      return infiniteScrollEnabled && postIndexIsMultipleOf30 && totalResults > postsPerPage
    },
    getNonZeroIndex(): number {
      const index = this.index as number
      return index + 1
    },
    generateFetchURL(): string {
      const queryParams = new URL(document.location.href).searchParams

      const newPage = page.value + 1

      page.value = newPage

      const subredditParam = document.location.pathname.startsWith('/sub/')
        ? `&subreddit=${document.location.pathname.replace('/sub/', '').replace('/', '')}`
        : ''

      const topFilterParam = queryParams.get('topFilter')
        ? `&topFilter=${queryParams.get('topFilter') as string}`
        : ''

      return `/api/infinite-scroll-load-more-posts?page=${newPage}${subredditParam}${topFilterParam}`
    },
    loadMorePosts(): void {
      const fetchUrl = this.generateFetchURL()

      console.info(fetchUrl)

      Fetcher.getJSON(fetchUrl)
        .then(results => console.log(results))
        .catch(err => console.error(err))
    },
    watchForComponentInView() {
      const postItemElement = this.$refs[`post-container-${this.post?.id as string}`] as HTMLDivElement
      const { loadMorePosts } = this

      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          // eslint-disable-next-line functional/no-conditional-statement
          if (!entry.isIntersecting) return

          loadMorePosts()

          observer.disconnect()
        })
      })

      observer.observe(postItemElement)
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
    postTitle(): string {
      // unescape to convert &amp; to &. Eg https://api.reddit.com/api/info/?id=t3_qaolx9
      return unescape(this.post?.title as string)
    },
    pageSeperatorNumber(): string {
      const resultsPerPage = 30
      return `${this.getNonZeroIndex() / resultsPerPage + 1}`
    },
  },
  // eslint-disable-next-line complexity
  mounted() {
    const infiniteScrollEnabled = this.userSettings?.infiniteScroll as boolean
    const totalResults = this.totalResults as number
    /*****
      We fetch more posts when the fourth last post is shown in the viewport. We also need to account for if the
      user is holding down the Ctrl+End key. In that case we also fetch more if the last post is shown at the bottom.
    *****/
    const isFourthLastPostPerPage =
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      this.getNonZeroIndex() === page.value * postsPerPage - 4

    const isLastPostInTotal = this.getNonZeroIndex() === this.totalResults

    const isLastPostInPageOfPosts = this.getNonZeroIndex() % postsPerPage === 0

    const isOnlyOnePageOfPosts = totalResults <= postsPerPage

    // eslint-disable-next-line functional/no-conditional-statement
    if (!infiniteScrollEnabled || isOnlyOnePageOfPosts || isLastPostInTotal) {
      return
    }

    // eslint-disable-next-line functional/no-conditional-statement
    if (isFourthLastPostPerPage || isLastPostInPageOfPosts) {
      this.$nextTick(this.watchForComponentInView)
    }
  },
  template: /* html */ `
  {{this.index + 1}}
    <div class="post-container" v-bind:ref="'post-container-' + post.id">
      <article>
        <h2>
          <a v-bind:href="postHref">{{ postTitle }}</a>
        </h2>
        <post-content-item 
          v-bind:post="post"
          v-if="!this.userSettings.onlyShowTitlesInFeed"
        ></post-content-item>
        <post-content-item-meta-container
          v-bind:post="post"
        ></post-content-item-meta-container>
      </article>
      <!-- Hiding the page seperator from screen readers -->
      <div aria-hidden="true" class="page-seperator" v-if="shouldShowPageSeperator(index)">
        <hr />
        <h4 class="page-seperator">Page {{ pageSeperatorNumber }}</h4>
        <hr />
      </div>
    </div>    
    `,
})

export { PostItem }
