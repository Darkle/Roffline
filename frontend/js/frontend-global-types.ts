import { CommentsContainer } from '../../db/entities/Comments'
import { Post } from '../../db/entities/Posts/Post'
import { User } from '../../db/entities/Users/User'

type PostWithDownloadedFiles = Post & { downloadedFiles: string[] }

type FrontendPost = PostWithDownloadedFiles & {
  prettyDateCreated: string
  prettyDateCreatedAgo: string
  comments?: CommentsContainer[]
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

type PostPageWindowWithProps = {
  userSettings: User
  post: FrontendPost
} & Window

export { IndexPageWindowWithProps, SettingsPageWindowWithProps, FrontendPost, PostPageWindowWithProps }
