import { AdminSettingsModel, AdminSettings } from './AdminSettings'
import { FeedsToFetchModel, FeedsToFetch } from './FeedsToFetch'
import { Post } from './Posts/Post'
import { PostModel } from './Posts/Posts'
import { SubredditsMasterListModel, SubredditsMasterList } from './SubredditsMasterList'
import { SubredditTable } from './SubredditTable'
import { UserModel } from './Users/Users'
import { User } from './Users/User'

type TableModels = AdminSettingsModel | FeedsToFetchModel | PostModel | SubredditsMasterListModel | UserModel
type TableModelTypes = AdminSettings | FeedsToFetch | Post | SubredditsMasterList | SubredditTable | User

export { TableModels, TableModelTypes }
