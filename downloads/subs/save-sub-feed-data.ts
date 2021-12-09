import * as R from 'ramda'

import { db } from '../../db/db'
import type { FeedWithData } from '../feeds/generate-feeds'
import { feedsLogger } from '../../logging/logging'
import type { TopPostsRowType } from '../../db/entities/SubredditTable'

type SubredditsPostIdReferencesFromFeeds = {
  [subreddit: string]: TopPostsRowType[]
}

const getEachSubredditsDataReadyForSubTable = R.reduce(
  (acc: SubredditsPostIdReferencesFromFeeds, subfeedData: FeedWithData): SubredditsPostIdReferencesFromFeeds => {
    const posts = subfeedData.data?.children || []
    const { subreddit, feedCategory } = subfeedData
    const newFeedPostIds = R.map(R.path(['data', 'id']), posts) as string[]
    const subredditPostIds = acc[subreddit] ?? ([] as TopPostsRowType[])

    /* eslint-disable functional/immutable-data,functional/no-conditional-statement,@typescript-eslint/no-extra-semi */
    newFeedPostIds.forEach((postId: string, index) => {
      if (!subredditPostIds[index]) {
        subredditPostIds[index] = {}
      }

      ;(subredditPostIds[index] as TopPostsRowType)[feedCategory] = postId
    })
    /* eslint-enable functional/immutable-data,functional/no-conditional-statement,@typescript-eslint/no-extra-semi  */

    return { ...acc, ...{ [subreddit]: subredditPostIds } }
  },
  {}
)

const getPostsAmountTotal = R.compose(
  R.sum,
  R.map((feed: FeedWithData): number => feed.data?.children?.length || 0)
)

async function saveEachSubsFeedDataToDB(subsFeedsData: FeedWithData[]): Promise<void> {
  const subsUpdating = R.uniq(subsFeedsData.map((feedData: FeedWithData): string => feedData.subreddit))
  const postsAmountTotal = getPostsAmountTotal(subsFeedsData)
  const subredditsPostIdReferencesFromFeeds = getEachSubredditsDataReadyForSubTable(subsFeedsData)

  feedsLogger.trace(`Clearing each subs table for following subs: ${subsUpdating.join()}`)

  await db.batchClearSubredditTables(subsUpdating)

  feedsLogger.debug(
    `Saving ${postsAmountTotal} post id's (this includes duplicate ids) for the following subs tables: ${subsUpdating.join()}`
  )

  await db.batchAddSubredditsPostIdReferences(subredditsPostIdReferencesFromFeeds)

  await db.batchUpdateSubredditsLastUpdatedTime(subsUpdating)
}

export { saveEachSubsFeedDataToDB }
