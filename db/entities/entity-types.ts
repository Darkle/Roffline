import { AdminSettingsModel, AdminSettings } from './AdminSettings'
// import { CommentsModel, Comments } from './Comments'
import { FeedsToFetchModel, FeedsToFetch } from './FeedsToFetch'
import { PostModel, Post } from './Posts'
import { SubredditsMasterListModel, SubredditsMasterList } from './SubredditsMasterList'
import { SubredditTable } from './SubredditTable'
import { UpdatesTrackerModel, UpdatesTracker } from './UpdatesTracker'
import { UserModel, User } from './Users'

type TableModels =
  | AdminSettingsModel
  // | CommentsModel
  | FeedsToFetchModel
  | PostModel
  | SubredditsMasterListModel
  | UpdatesTrackerModel
  | UserModel
type TableModelTypes =
  // | Comments
  AdminSettings | FeedsToFetch | Post | SubredditsMasterList | SubredditTable | UpdatesTracker | User

export { TableModels, TableModelTypes }
