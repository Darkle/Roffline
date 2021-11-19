import * as R from 'ramda'
import RA from 'ramda-adjunct'

const feedCategories = [
  'posts_Default',
  'topPosts_Day',
  'topPosts_Week',
  'topPosts_Month',
  'topPosts_Year',
  'topPosts_All',
]

type Feeds = {
  subreddit: string
  feedCategory: string
  feedUrl: string
}

const feedCategoryToUrlQueryParam = (feedCategory: string): string =>
  (feedCategory.split('_')[1] as string).toLowerCase()

const createInitialFeedsForEachSubreddit = (subs: string[]): Feeds[] =>
  subs.flatMap(subreddit =>
    feedCategories.map(feedCategory => ({
      subreddit,
      feedCategory,
      feedUrl:
        feedCategory === 'posts_Default'
          ? `https://www.reddit.com/r/${subreddit}/.json?limit=100&count=100`
          : `https://www.reddit.com/r/${subreddit}/top/.json?limit=100&t=${feedCategoryToUrlQueryParam(
              feedCategory
            )}&count=100`,
    }))
  )

const setPaginationQueryParam = (feedUrl: string, pagination: string): string =>
  `${feedUrl.split('&after=')[0] as string}&after=${pagination}`

const feedUrlsNeedToBeUpdatedForPagination = R.compose(RA.isNotNil, R.path(['feedUrl']))

const updateFeedsWithPaginationForEachSubredditFeed = R.map(
  R.when(feedUrlsNeedToBeUpdatedForPagination, feedData => ({
    ...feedData,
    feedUrl: setPaginationQueryParam(feedData.feedUrl, feedData.data.after),
  }))
)

const isNotObject = R.complement(R.is(Object))

const isInitalListOfSubs = R.all(isNotObject)

const generateSubFeeds = R.ifElse(
  isInitalListOfSubs,
  createInitialFeedsForEachSubreddit,
  updateFeedsWithPaginationForEachSubredditFeed
)

export {
  createInitialFeedsForEachSubreddit,
  generateSubFeeds,
  feedCategoryToUrlQueryParam,
  setPaginationQueryParam,
  updateFeedsWithPaginationForEachSubredditFeed,
  feedCategories,
  isInitalListOfSubs,
  feedUrlsNeedToBeUpdatedForPagination,
}
