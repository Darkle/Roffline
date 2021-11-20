import { AdminSettingsModel, AdminSettings } from './AdminSettings'
import { Post } from './Posts/Post'
import { PostModel } from './Posts/Posts'
import { SubredditsMasterListModel, SubredditsMasterList } from './SubredditsMasterList'
import { SubredditTable } from './SubredditTable'
import { UserModel } from './Users/Users'
import { User } from './Users/User'

type TableModels = AdminSettingsModel | PostModel | SubredditsMasterListModel | UserModel
type TableModelTypes = AdminSettings | Post | SubredditsMasterList | SubredditTable | User

export { TableModels, TableModelTypes }
