import type { Post, PostWithComments } from '../../db/entities/Posts/Post'
import type { User } from '../../db/entities/Users/User'

type PostWithDownloadedFiles = Post & { downloadedFiles: string[] }

type FrontendPost = PostWithDownloadedFiles & {
  prettyDateCreated: string
  prettyDateCreatedAgo: string
  comments?: PostWithComments['comments']
}

type IndexPageWindowWithProps = {
  userSettings: User
  posts: FrontendPost[]
  totalResults: number
} & Window

type SettingsPageWindowWithProps = {
  csrfToken: string
  userSettings: User
} & Window

type SubManagementPagePageWindowWithProps = SettingsPageWindowWithProps & Window

type PostPageWindowWithProps = {
  userSettings: User
  post: FrontendPost
} & Window

export {
  IndexPageWindowWithProps,
  SettingsPageWindowWithProps,
  FrontendPost,
  PostPageWindowWithProps,
  SubManagementPagePageWindowWithProps,
}
