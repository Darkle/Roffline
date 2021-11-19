import * as R from 'ramda'
import RA from 'ramda-adjunct'

const isNotEmptyFeed = R.both(R.pathSatisfies(RA.isNotEmpty, ['data', 'children']), RA.isNotNil)

const removeEmptyFeeds = R.filter(isNotEmptyFeed)

const someFeedsHaveMoreDataToGet = R.any(R.pathSatisfies(RA.isNotNil, ['data', 'after']))

const trimFeedDataForLogging = R.reduce((acc, subFeedCategoryData) => {
  const { subreddit } = subFeedCategoryData
  const subFeedData = R.propOr({}, subreddit)(acc)
  const posts = R.pathOr([], ['data', 'children'], subFeedCategoryData)
  const feedCategory = R.lensProp(subFeedCategoryData.feedCategory)
  const updatedSubFeedData = R.set(feedCategory, R.length(posts))(subFeedData)

  return { ...acc, ...{ [subreddit]: updatedSubFeedData } }
}, {})

const getPostsFromFeedData = R.compose(R.defaultTo([]), R.path(['data', 'children']))

const feedHasNextPagination = R.pathSatisfies(RA.isNotNil, ['data', 'after'])

const feedIsInitialFeedUpdate = R.pathSatisfies(R.isNil, ['data'])

const subHasMoreFeedData = R.anyPass([feedHasNextPagination, feedIsInitialFeedUpdate])

const getPostsFromFeedItem = R.map(R.path(['data', 'children']))

const filterDuplicatePosts = R.uniqBy(R.path(['data', 'id']))

const collateAllPostsFromAllFeeds = R.compose(filterDuplicatePosts, R.flatten, getPostsFromFeedItem)

export {
  removeEmptyFeeds,
  someFeedsHaveMoreDataToGet,
  collateAllPostsFromAllFeeds,
  trimFeedDataForLogging,
  getPostsFromFeedData,
  subHasMoreFeedData,
  isNotEmptyFeed,
  feedHasNextPagination,
  feedIsInitialFeedUpdate,
  getPostsFromFeedItem,
  filterDuplicatePosts,
}
