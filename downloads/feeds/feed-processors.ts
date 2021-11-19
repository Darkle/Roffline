import * as R from 'ramda'

const trimFeedDataForLogging = R.reduce((acc, subFeedCategoryData) => {
  const { subreddit } = subFeedCategoryData
  const subFeedData = R.propOr({}, subreddit)(acc)
  const posts = R.pathOr([], ['data', 'children'], subFeedCategoryData)
  const feedCategory = R.lensProp(subFeedCategoryData.feedCategory)
  const updatedSubFeedData = R.set(feedCategory, R.length(posts))(subFeedData)

  return { ...acc, ...{ [subreddit]: updatedSubFeedData } }
}, {})

const getPostsFromFeedItem = R.map(R.path(['data', 'children']))

const filterDuplicatePosts = R.uniqBy(R.path(['data', 'id']))

const collateAllPostsFromAllFeeds = R.compose(filterDuplicatePosts, R.flatten, getPostsFromFeedItem)

export { collateAllPostsFromAllFeeds, trimFeedDataForLogging, getPostsFromFeedItem, filterDuplicatePosts }
