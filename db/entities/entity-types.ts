import { AdminSettingsModel, AdminSettings } from './AdminSettings'
import { FeedsToFetchModel, FeedsToFetch } from './FeedsToFetch'
import { PostModel, Post } from './Posts'
import { SubredditsMasterListModel, SubredditsMasterList } from './SubredditsMasterList'
import { SubredditTable } from './SubredditTable'
import { UpdatesTrackerModel, UpdatesTracker } from './UpdatesTracker'
import { UserModel, User } from './Users'

type TableModels =
  | AdminSettingsModel
  | FeedsToFetchModel
  | PostModel
  | SubredditsMasterListModel
  | UpdatesTrackerModel
  | UserModel
type TableModelTypes =
  | AdminSettings
  | FeedsToFetch
  | Post
  | SubredditsMasterList
  | SubredditTable
  | UpdatesTracker
  | User

export { TableModels, TableModelTypes }
