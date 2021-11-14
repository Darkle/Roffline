import { Post } from '../../../../db/entities/Posts/Post'
import { User } from '../../../../db/entities/Users/User'
import { CommentsWithMetadata } from '../../../../db/entities/Comments'

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
}

type FeedsToFetch = {
  feed: string
}

type SubredditsMasterListRow = {
  subreddit: string
}

type CommentsFromCommentsDB = { key: string; value: string }

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
  | CommentsFromCommentsDB[]
  | FeedsToFetch[]
  | SubredditsMasterListRow[]
  | SubredditTableRow[]

type JsonViewerData =
  | User
  | Post
  | AdminSettings
  | { postId: string; comments: CommentsWithMetadata }
  | FeedsToFetch
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

export { DbTables, TableColumnType, DatabaseTypes, TablesColumnsType, JsonViewerData, CommentsFromCommentsDB }
