import { Post } from '../../db/entities/Posts/Post'
import { User } from '../../db/entities/Users/User'

type PostWithDownloadedFiles = Post & { downloadedFiles: string[] }

type PostWithDownloadedFilesAndPrettyDate = PostWithDownloadedFiles & {
  prettyDateCreated: string
  prettyDateCreatedAgo: string
}

type WindowWithProps = {
  csrfToken: string
  userSettings: User[]
  posts: PostWithDownloadedFilesAndPrettyDate[]
} & Window

export { WindowWithProps }
