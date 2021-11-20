import { AdminSettings } from '../../db/entities/AdminSettings'
import { saveEachSubsFeedDataToDB } from '../subs/save-sub-feed-data'
import { fetchFeeds } from './fetch-feeds'
import { createInitialFeedsForEachSubreddit, FeedWithData } from './generate-feeds'

type Subreddit = string

async function updateSubsFeeds(adminSettings: AdminSettings, subs: Set<Subreddit>): Promise<FeedWithData[]> {
  const subsToUpdate = [...subs]

  const initialSubsFeeds = createInitialFeedsForEachSubreddit(subsToUpdate)

  const subsFeedsData = await fetchFeeds(adminSettings, initialSubsFeeds)

  await saveEachSubsFeedDataToDB(subsFeedsData)

  return subsFeedsData
}

export { updateSubsFeeds }
