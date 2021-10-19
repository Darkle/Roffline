import { Post } from '../../db/entities/Posts/Post'
import { User } from '../../db/entities/Users/User'

type PostWithDownloadedFiles = Post & { downloadedFiles: string[] }

type FrontendPost = PostWithDownloadedFiles & {
  prettyDateCreated: string
  prettyDateCreatedAgo: string
}

type WindowWithProps = {
  csrfToken: string
  userSettings: User
  posts: FrontendPost[]
  totalResults: number
} & Window

export { WindowWithProps, FrontendPost }
