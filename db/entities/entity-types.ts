import { AdminSettingsModel, AdminSettings } from './AdminSettings'
import { PostsToGetModel, PostsToGet } from './PostsToGet'
import { Post } from './Posts/Post'
import { PostModel } from './Posts/Posts'
import { SubredditsMasterListModel, SubredditsMasterList } from './SubredditsMasterList'
import { SubredditTable } from './SubredditTable'
import { UserModel } from './Users/Users'
import { User } from './Users/User'

type TableModels = AdminSettingsModel | PostsToGetModel | PostModel | SubredditsMasterListModel | UserModel
type TableModelTypes = AdminSettings | PostsToGet | Post | SubredditsMasterList | SubredditTable | User

export { TableModels, TableModelTypes }
