import { Post } from '../../db/entities/Posts/Post'
import { User } from '../../db/entities/Users/User'

type PostWithDownloadedFiles = Post & { downloadedFiles: string[] }

type FrontendPost = PostWithDownloadedFiles & {
  prettyDateCreated: string
  prettyDateCreatedAgo: string
}

// type GlobalVolumeStore = {
//   volume: number
//   getVolume: () => number
//   updateVolume: (vol: number) => void
// }

type WindowWithProps = {
  csrfToken: string
  userSettings: User[]
  posts: FrontendPost[]
  // globalVolumeStore: GlobalVolumeStore
} & Window

export { WindowWithProps, FrontendPost }
