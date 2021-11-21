import { Post } from '../../db/entities/Posts/Post'

type FeedData = { children: Post[]; after: null | string; before: null | string }

type FeedCategory =
  | 'posts_Default'
  | 'topPosts_Day'
  | 'topPosts_Week'
  | 'topPosts_Month'
  | 'topPosts_Year'
  | 'topPosts_All'

type FeedWithData = {
  subreddit: string
  feedCategory: FeedCategory
  feedUrl: string
  data: FeedData | null
}

const feedCategories: FeedCategory[] = [
  'posts_Default',
  'topPosts_Day',
  'topPosts_Week',
  'topPosts_Month',
  'topPosts_Year',
  'topPosts_All',
]

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

const setPaginationQueryParam = (feedUrl: string, pagination: string | null | undefined): string =>
  pagination ? `${feedUrl.split('&after=')[0] as string}&after=${pagination}` : feedUrl

const updatePaginationForEachFeedsUrl = (feeds: FeedWithData[]): FeedWithData[] =>
  feeds.map(
    (feed: FeedWithData): FeedWithData => ({
      ...feed,
      feedUrl: setPaginationQueryParam(feed.feedUrl, feed.data?.after),
    })
  )

export {
  createInitialFeedsForEachSubreddit,
  setPaginationQueryParam,
  updatePaginationForEachFeedsUrl,
  FeedWithData,
}
