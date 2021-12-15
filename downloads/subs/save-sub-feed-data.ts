import * as R from 'ramda'

import { db } from '../../db/db'
import type { FeedWithData } from '../feeds/generate-feeds'
import { feedsLogger } from '../../logging/logging'
import type { TopPostsRowType } from '../../db/entities/SubredditTable'
import type { Post } from '../../db/entities/Posts/Post'

type SubredditsPostIdReferencesFromFeeds = {
  [subreddit: string]: TopPostsRowType[]
}

type Subreddit = string

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

const getPostsAmountTotal = (feeds: FeedWithData[]): number =>
  R.uniqBy(
    R.path(['data', 'id']),
    feeds.flatMap((feed: FeedWithData): Post[] | [] => (feed.data?.children?.length ? feed.data?.children : []))
  ).length

async function saveEachSubsFeedDataToDB(subsFeedsData: FeedWithData[], subs: Set<Subreddit>): Promise<void> {
  const subsUpdating = [...subs]
  const postsAmountTotal = getPostsAmountTotal(subsFeedsData)
  const subredditsPostIdReferencesFromFeeds = getEachSubredditsDataReadyForSubTable(subsFeedsData)

  feedsLogger.trace(`Clearing each subs table for following subs: ${subsUpdating.join()}`)

  await db.batchClearSubredditTables(subsUpdating)

  feedsLogger.debug(`Saving ${postsAmountTotal} post id's for the following subs tables: ${subsUpdating.join()}`)

  await db.batchAddSubredditsPostIdReferences(subredditsPostIdReferencesFromFeeds)

  await db.batchUpdateSubredditsLastUpdatedTime(subsUpdating)
}

export { saveEachSubsFeedDataToDB }
