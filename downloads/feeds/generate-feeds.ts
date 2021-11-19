import { Post } from '../../db/entities/Posts/Post'

const feedCategories = [
  'posts_Default',
  'topPosts_Day',
  'topPosts_Week',
  'topPosts_Month',
  'topPosts_Year',
  'topPosts_All',
]

type FeedData = { children: Post[]; after: null | string; before: null | string }

type FeedWithData = {
  subreddit: string
  feedCategory: string
  feedUrl: string
  data: FeedData | null
}

const feedCategoryToUrlQueryParam = (feedCategory: string): string =>
  (feedCategory.split('_')[1] as string).toLowerCase()

const createInitialFeedsForEachSubreddit = (subs: string[]): FeedWithData[] =>
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
      data: null,
    }))
  )

const setPaginationQueryParam = (feedUrl: string, pagination: string | null): string =>
  pagination ? `${feedUrl.split('&after=')[0] as string}&after=${pagination}` : feedUrl

const updatePaginationForEachFeedsUrl = (feeds: FeedWithData[]): FeedWithData[] =>
  feeds.map(
    (feed: FeedWithData): FeedWithData =>
      feed.data
        ? {
            ...feed,
            feedUrl: setPaginationQueryParam(feed.feedUrl, feed.data.after),
          }
        : feed
  )

export {
  createInitialFeedsForEachSubreddit,
  feedCategoryToUrlQueryParam,
  setPaginationQueryParam,
  updatePaginationForEachFeedsUrl,
  feedCategories,
  FeedWithData,
}
