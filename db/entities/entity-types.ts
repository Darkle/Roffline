import { AdminSettings, AdminSettingsType } from './AdminSettings'
import { Comments, CommentsType } from './Comments'
import { FeedsToFetch, FeedsToFetchType } from './FeedsToFetch'
import { Post, PostType } from './Posts'
import { SubredditsMasterList, SubredditsMasterListType } from './SubredditsMasterList'
import { UpdatesTracker, UpdatesTrackerType } from './UpdatesTracker'
import { User, UserType } from './Users'

type TableModels = AdminSettings | Comments | FeedsToFetch | Post | SubredditsMasterList | UpdatesTracker | User
type TableModelTypes =
  | CommentsType
  | AdminSettingsType
  | FeedsToFetchType
  | PostType
  | SubredditsMasterListType
  | UpdatesTrackerType
  | UserType

export { TableModels, TableModelTypes }
