import type { Comments } from '../Comments'

type Oembed = {
  provider_url: string
  version: string
  title: string
  type: string
  thumbnail_width: number
  height: number
  width: number
  html: string
  provider_name: string
  thumbnail_url: string
  thumbnail_height: number
  author_url: string
}

type PostMediaKey = {
  type: string
  oembed: Oembed
}

type Post = {
  id: string
  subreddit: string
  author: string
  title: string
  selftext: string
  selftext_html: string
  score: number
  is_self: boolean
  //  created_utc is a unix timestamp (ie the number of seconds since the epoch)
  created_utc: number
  domain: string
  is_video: boolean
  stickied: boolean
  media_has_been_downloaded: boolean
  mediaDownloadTries: number
  post_hint: string
  permalink: string
  url: string
  media: PostMediaKey
  crosspost_parent: string
  commentsDownloaded: boolean
}

type PostWithComments = {
  comments: Comments | null
} & Post

export { Post, PostMediaKey, Oembed, PostWithComments }
