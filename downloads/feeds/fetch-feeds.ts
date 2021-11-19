import R from 'ramda'
import fetch, { Response } from 'node-fetch'
import RA from 'ramda-adjunct'
import Prray from 'prray'

import { AdminSettings } from '../../db/entities/AdminSettings'
import { feedsLogger } from '../../logging/logging'
import { FeedWithData, updatePaginationForEachFeedsUrl } from './generate-feeds'
import { Post } from '../../db/entities/Posts/Post'

type RawSubFeedData = { children: Post[]; after: null | string; before: null | string }

type RawSubFeedWithData = {
  kind: string
  data: RawSubFeedData
}

type EmptyFeedResponseData = { children: never[]; after: null; before: null }

type EmptyFeedResponse = { data: EmptyFeedResponseData }

const emptyFeedResponseForFetchError = { data: { children: [], after: null, before: null } }

const addNewPostsToSubFeedData = (
  subFeedData: FeedWithData,
  newSubFeedData: RawSubFeedWithData | EmptyFeedResponse
): FeedWithData => {
  const currentFeedPosts = subFeedData.data?.children ?? []
  const newFeedPosts = newSubFeedData.data?.children ?? []

  return {
    subreddit: subFeedData.subreddit,
    feedCategory: subFeedData.feedCategory,
    feedUrl: subFeedData.feedUrl,
    data: { ...newSubFeedData.data, children: [...currentFeedPosts, ...newFeedPosts] },
  }
}

const handleFeedFetchResponse = (resp: Response): Promise<RawSubFeedWithData | EmptyFeedResponse> =>
  resp.ok ? (resp.json() as Promise<RawSubFeedWithData>) : Promise.resolve(emptyFeedResponseForFetchError)

function fetchFeed(subFeedData: FeedWithData): Promise<FeedWithData | void> {
  feedsLogger.debug(`fetching ${subFeedData.feedUrl}`)

  // prettier-ignore
  return fetch(subFeedData.feedUrl)
    .then(handleFeedFetchResponse)
    .then(newSubFeedData => addNewPostsToSubFeedData(subFeedData, newSubFeedData))
    /*****
     Not bothering to log here on error generally as this will happen fairly regularly when the host goes offline.
    The .catch void returns are removed later with removeEmptyFeeds.
    *****/
    .catch(err => feedsLogger.trace(err))
}

const subHasMoreFeedData = R.pathSatisfies(RA.isNotNil, ['data', 'after'])

const fetchFeedIfItHasMoreData = R.when(subHasMoreFeedData, fetchFeed)

// R.any checks all items in an array
const someFeedsHaveMoreDataToGet = R.any(R.pathSatisfies(RA.isNotNil, ['data', 'after']))

const isNotEmptyFeed = R.both(R.pathSatisfies(RA.isNotEmpty, ['data', 'children']), RA.isNotNil)

const removeEmptyFeeds = R.filter(isNotEmptyFeed)

const summarizeFeedDataForLogging = R.reduceBy(
  (postCount: number, feed: FeedWithData) => postCount + (feed.data?.children?.length || 0),
  0,
  (feed: FeedWithData) => feed.subreddit
)

async function fetchFeeds(
  adminSettings: AdminSettings,
  subsFeedsWithData: FeedWithData[]
): Promise<FeedWithData[]> {
  const fetchedFeeds = (await Prray.from(subsFeedsWithData)
    .mapAsync(fetchFeedIfItHasMoreData, { concurrency: adminSettings.numberFeedsOrPostsDownloadsAtOnce })
    .then(removeEmptyFeeds)) as Prray<FeedWithData>

  // eslint-disable-next-line functional/no-conditional-statement
  if (someFeedsHaveMoreDataToGet(fetchedFeeds)) {
    const subsFeedsWithDataWithUpdatedPaginationInFeedUrl = updatePaginationForEachFeedsUrl(subsFeedsWithData)

    return fetchFeeds(adminSettings, subsFeedsWithDataWithUpdatedPaginationInFeedUrl)
  }

  feedsLogger.debug(`Successfully fetched the following number of posts for these subs:`, {
    fetchedFeeds: summarizeFeedDataForLogging(fetchedFeeds),
  })

  return fetchedFeeds
}

export { fetchFeeds }
