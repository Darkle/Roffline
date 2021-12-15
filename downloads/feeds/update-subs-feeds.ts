import type { AdminSettings } from '../../db/entities/AdminSettings'
import { saveEachSubsFeedDataToDB } from '../subs/save-sub-feed-data'
import { fetchFeeds } from './fetch-feeds'
import type { FeedWithData } from './generate-feeds'
import { createInitialFeedsForEachSubreddit } from './generate-feeds'

type Subreddit = string

async function updateSubsFeeds(
  adminSettings: AdminSettings,
  subs: Set<Subreddit>
): Promise<{
  subsFeedsData: FeedWithData[]
  subsUpdated: string[]
}> {
  const subsToUpdate = [...subs]

  const initialSubsFeeds = createInitialFeedsForEachSubreddit(subsToUpdate)

  const subsFeedsData = await fetchFeeds(adminSettings, initialSubsFeeds)

  await saveEachSubsFeedDataToDB(subsFeedsData, subs)

  return { subsFeedsData, subsUpdated: subsToUpdate }
}

export { updateSubsFeeds }
