import * as R from 'ramda'

const getPostsFromFeedItem = R.map(R.path(['data', 'children']))

const filterDuplicatePosts = R.uniqBy(R.path(['data', 'id']))

const collateAllPostsFromAllFeeds = R.compose(filterDuplicatePosts, R.flatten, getPostsFromFeedItem)
