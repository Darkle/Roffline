import R from 'ramda'
import fetch from 'node-fetch'

import { AdminSettings } from '../../db/entities/AdminSettings'
import { feedsLogger } from '../../logging/logging'
import { removeEmptyFeeds } from './feed-processors'

const emptyFeedResponseForFetchError = { data: { children: [], after: null, before: null } }

const addNewPostsToFeedData = (feedData, newFeedData) => {
  const currentFeedPosts = getPostsFromFeedData(feedData)
  const newFeedPosts = getPostsFromFeedData(newFeedData)
  const totalPostsForFeed = [...currentFeedPosts, ...newFeedPosts]

  return {
    ...feedData,
    ...newFeedData,
    ...{ data: { ...newFeedData.data, children: totalPostsForFeed } },
  }
}

const handleFeedFetchResponse = resp => (resp.ok ? resp.json() : emptyFeedResponseForFetchError)

function fetchFeed(feedData) {
  feedUpdateLogger.debug(`fetching ${feedData.feedUrl}`)

  // prettier-ignore
  return (
    fetch(feedData.feedUrl)
      .then(handleFeedFetchResponse)
      .then(newFeedData => addNewPostsToFeedData(feedData, newFeedData))
      /*****
      Not bothering to log here generally on error as this will happen fairly regularly
        when the host goes offline.
      *****/
      .catch(err => feedsLogger.trace(err))
  )
}

const fetchFeedIfItHasMoreData = R.when(subHasMoreFeedData, fetchFeed)

async function fetchFeeds(adminSettings: AdminSettings, subreddits) {
  const subFeeds = generateSubFeeds(R.pluck('subreddit', subreddits))

  const fetchedFeeds = await Prray.from(subFeeds)
    .mapAsync(fetchFeedIfItHasMoreData, { concurrency: adminSettings.numberFeedsOrPostsDownloadsAtOnce })
    .then(removeEmptyFeeds)

  // return await as opposed to just return the promise is for the stacktrace
  // eslint-disable-next-line functional/no-conditional-statement, no-return-await
  if (someFeedsHaveMoreDataToGet(fetchedFeeds)) return await fetchFeeds(fetchedFeeds)

  // eslint-disable-next-line functional/no-conditional-statement
  if (fetchedFeeds.length) {
    feedsLogger.debug(`successfully fetched the following feed data`, {
      fetchedFeeds: trimFeedDataForLogging(fetchedFeeds),
    })
  }

  return fetchedFeeds
}
