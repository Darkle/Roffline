import * as Vue from 'vue'

import { WindowWithProps } from '../frontend-global-types'
import { PostItem } from './components/PostItem'

declare const window: WindowWithProps

const getLocallyStoredVolumeSetting = (): number => {
  const volume = localStorage.getItem('volume')
  // Volume is between 0 and 1. 1 being 100%.
  return volume ? Number(volume) : 1
}

window.globalVolumeStore = {
  volume: getLocallyStoredVolumeSetting(),
  getVolume(): number {
    return this.volume
  },
  updateVolume(vol: number): void {
    this.volume = vol
    localStorage.setItem('volume', vol.toString())
  },
}

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

Vue.createApp(IndexPage).mount('body')

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

// function registerEventHandlersToRememberVideoVolume({ id: postId }) {
//   const videoElem = document.querySelector(`.video-postid-${postId}`)
//   videoElem?.addEventListener('volumechange', _ => localStorage.setItem('volume', `${videoElem.volume}`))

//   videoElem?.addEventListener('play', _ => {
//     const globalVolume = localStorage.getItem('volume')
//     // eslint-disable-next-line functional/no-conditional-statement
//     if (globalVolume) {
//       videoElem.volume = Number(globalVolume) // eslint-disable-line functional/immutable-data
//     }
//   })
// }

// const postsPerPage = 30

// function shouldShowPageSeperator(index) {
//   const isNotFirstPost = index !== 0
//   const postIndexIsMultipleOf30 = (index + 1) % postsPerPage === 0
//   const isNotLastPost = index !== this.posts.length - 1

//   return this.settings.infiniteScroll && isNotFirstPost && postIndexIsMultipleOf30 && isNotLastPost
// }

// function setUpPhotoCarousel({ id: postId }) {
//   const galleryElem = document.querySelector(`.gallery-postid-${postId}`)
//   // eslint-disable-next-line functional/no-conditional-statement
//   if (!galleryElem) return

//   EmblaCarousel(galleryElem, { loop: false })
// }

// const oneSecondInMS = 1000

// function initMediaHandlers(post) {
//   // Wait for next tick as alpine is doing innerHTML stuff
//   setTimeout(_ => {
//     registerEventHandlersToRememberVideoVolume(post)
//     setUpPhotoCarousel(post)
//   }, oneSecondInMS)
// }

// window.indexPage = _ => ({
//   settings: window.userSettings,
//   posts: window.posts,
//   pluralisePostScore,
//   shouldShowPost,
//   loadMorePosts,
//   // Start at 1 as the first page is already loaded (offset starts at 0).
//   page: 1,
//   initMediaHandlers,
//   shouldShowPageSeperator,
// })
