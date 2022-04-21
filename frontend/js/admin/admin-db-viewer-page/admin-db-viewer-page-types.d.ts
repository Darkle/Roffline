import type { Post } from '../../../../db/entities/Posts/Post'
import type { User } from '../../../../db/entities/Users/User'
import type { Comments } from '../../../../db/entities/Comments'
import type { CommentsDBRow } from '../../../../db/db'

type AdminSettings = {
  downloadComments: boolean
  numberFeedsOrPostsDownloadsAtOnce: number
  numberMediaDownloadsAtOnce: number
  downloadVideos: boolean
  videoDownloadMaxFileSize: string
  videoDownloadResolution: string
  updateAllDay: boolean
  updateStartingHour: number
  updateEndingHour: number
  downloadImages: boolean
  downloadArticles: boolean
}

type SubredditsMasterListRow = {
  subreddit: string
}

type TopPostsTypeKeys =
  | 'posts_Default'
  | 'topPosts_Day'
  | 'topPosts_Week'
  | 'topPosts_Month'
  | 'topPosts_Year'
  | 'topPosts_All'

type SubredditTableRow = {
  [K in TopPostsTypeKeys]: string | null
}

type DatabaseTypes =
  | User[]
  | Post[]
  | [AdminSettings]
  | CommentsDBRow[]
  | SubredditsMasterListRow[]
  | SubredditTableRow[]

type JsonViewerData =
  | User
  | Post
  | AdminSettings
  | { postId: string; comments: Comments }
  | SubredditsMasterListRow
  | SubredditTableRow

type DbTables = string[]

type TableColumnType = {
  label: string
  field: string
  type?: string
  sortable?: boolean
  width?: string
  formatFn?: (value: unknown) => string
}

type TablesColumnsType = {
  [key: string]: TableColumnType[]
}

export { DbTables, TableColumnType, DatabaseTypes, TablesColumnsType, JsonViewerData }
