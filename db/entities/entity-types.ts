import type { AdminSettingsModel, AdminSettings } from './AdminSettings'
import type { Post } from './Posts/Post'
import type { PostModel } from './Posts/Posts'
import type { SubredditsMasterListModel, SubredditsMasterList } from './SubredditsMasterList'
import type { SubredditTable } from './SubredditTable'
import type { UserModel } from './Users/Users'
import type { User } from './Users/User'

type TableModels = AdminSettingsModel | PostModel | SubredditsMasterListModel | UserModel
type TableModelTypes = AdminSettings | Post | SubredditsMasterList | SubredditTable | User

export { TableModels, TableModelTypes }
