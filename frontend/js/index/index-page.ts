import * as Vue from 'vue'
import VueSplide from '@splidejs/vue-splide'

import { WindowWithProps } from '../frontend-global-types'
import { PostItem } from './components/PostItem'
import { ignoreScriptTagCompilationWarnings } from '../frontend-utils'

declare const window: WindowWithProps

const IndexPage = Vue.defineComponent({
  data() {
    return {
      posts: window.posts,
      userSettings: window.userSettings,
    }
  },
  components: {
    PostItem,
  },
})

const app = Vue.createApp(IndexPage)

// warnHandler is ignored in production https://v3.vuejs.org/api/application-config.html#warnhandler
app.config.warnHandler = ignoreScriptTagCompilationWarnings

app.use(VueSplide).mount('body')

// import { Fetcher } from './frontend-utils'

// const fetchCache = new Set()

// const updateState = (store, key, val) => (store[key] = val) // eslint-disable-line functional/immutable-data

// const addNewPostsToState = (state, newPosts) => updateState(state, 'posts', [...state.posts, ...newPosts])

// // eslint-disable-next-line @typescript-eslint/no-magic-numbers
// const postIsFourthLastPost = (state, postIndex) => state.posts.length - 4 === postIndex

// const postIsLastPost = (state, postIndex) => state.posts.length - 1 === postIndex

// const shouldLoadMorePosts = (state, postIndex) =>
//   state.settings.infiniteScroll && (postIsFourthLastPost(state, postIndex) || postIsLastPost(state, postIndex))

// function generateFetchURL(state) {
//   const queryParams = new URL(document.location.href).searchParams

//   const newPage = state.page + 1

//   updateState(state, 'page', newPage)

//   const subredditParam = document.location.pathname.startsWith('/sub/')
//     ? `&subreddit=${document.location.pathname.replace('/sub/', '')}`
//     : ''

//   const topFilterParam = queryParams.get('topFilter') ? `&topFilter=${queryParams.get('topFilter')}` : ''

//   return `/api/infinite-scroll-load-more-posts?page=${newPage}${subredditParam}${topFilterParam}`
// }

// const alreadyFetchedThisUrl = url => fetchCache.has(url)

// /*****
//   We fetch more posts when the fourth last post is shown in the viewport. We also need to account for if the
//   user is holding down the Ctrl+End key. In that case we also fetch more if the last post is shown at the bottom.
//   We use a cache of previous fetch urls to check if we have already fetch it if the fourth last post triggered it already.
// *****/
// function loadMorePosts(postIndex) {
//   const state = this
//   // eslint-disable-next-line functional/no-conditional-statement
//   if (!shouldLoadMorePosts(state, postIndex)) return

//   const fetchUrl = generateFetchURL(state)

//   console.log(fetchUrl)

//   // eslint-disable-next-line functional/no-conditional-statement
//   if (alreadyFetchedThisUrl(fetchUrl)) return

//   fetchCache.add(fetchUrl)

//   Fetcher.getJSON(fetchUrl)
//     .then(({ posts: newPosts }) => addNewPostsToState(state, newPosts))
//     .catch(handleFrontendError)
// }

// const pluralisePostScore = score => `${score} ${score === 0 || score > 1 ? 'points' : 'point'}`

// function shouldShowPost(post) {
//   return !(post.stickied && this.settings.hideStickiedPosts)
// }

// const postsPerPage = 30

// function shouldShowPageSeperator(index) {
//   const isNotFirstPost = index !== 0
//   const postIndexIsMultipleOf30 = (index + 1) % postsPerPage === 0
//   const isNotLastPost = index !== this.posts.length - 1

//   return this.settings.infiniteScroll && isNotFirstPost && postIndexIsMultipleOf30 && isNotLastPost
// }

// window.indexPage = _ => ({
//   shouldShowPost,
//   loadMorePosts,
//   // Start at 1 as the first page is already loaded (offset starts at 0).
//   page: 1,
//   shouldShowPageSeperator,
// })
