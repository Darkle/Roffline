import { AdminSettings } from '../../db/entities/AdminSettings'
import { fetchFeeds } from './fetch-feeds'
import { createInitialFeedsForEachSubreddit } from './generate-feeds'

type Subreddit = string

function updateSubsFeeds(adminSettings: AdminSettings, subs: Set<Subreddit>): Promise<void> {
  const subsToUpdate = [...subs]

  const initialSubsFeeds = createInitialFeedsForEachSubreddit(subsToUpdate)

  return fetchFeeds(adminSettings, initialSubsFeeds).then(saveEachSubsFeedDataToDB)
}

export { updateSubsFeeds }
