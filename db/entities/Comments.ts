type Comments = {
  postId: string
  comments: string
}

/* eslint-disable @typescript-eslint/no-explicit-any */

type Media = {
  type: string
  oembed: {
    provider_url: string
    version: string
    title: string
    type: string
    thumbnail_width: number
    height: number
    width: number
    html: string
    author_name: string
    provider_name: string
    thumbnail_url: string
    thumbnail_height: number
    author_url: string
  }
}

type ActualPostData = {
  approved_at_utc: null | boolean
  subreddit: string
  selftext: string
  user_reports: any[]
  saved: boolean
  mod_reason_title: any
  gilded: number
  clicked: boolean
  title: string
  link_flair_richtext: any[]
  subreddit_name_prefixed: string
  hidden: boolean
  pwls: number
  link_flair_css_class: string
  downs: number
  thumbnail_height: number
  top_awarded_type: any
  parent_whitelist_status: string
  hide_score: boolean
  name: string
  quarantine: boolean
  link_flair_text_color: string
  upvote_ratio: number
  author_flair_background_color: null
  ups: number
  domain: string
  media_embed: any
  thumbnail_width: number
  author_flair_template_id: string
  is_original_content: boolean
  author_fullname: string
  secure_media: any
  is_reddit_media_domain: boolean
  is_meta: boolean
  category: null
  secure_media_embed: any
  link_flair_text: string
  can_mod_post: boolean
  score: number
  approved_by: null
  is_created_from_ads_ui: boolean
  author_premium: boolean
  thumbnail: string
  edited: boolean
  author_flair_css_class: string
  author_flair_richtext: any
  gildings: any
  post_hint: string
  content_categories: string[]
  is_self: boolean
  subreddit_type: string
  created: number
  link_flair_type: string
  wls: number
  removed_by_category: any
  banned_by: any
  author_flair_type: string
  total_awards_received: number
  allow_live_comments: boolean
  selftext_html: null | string
  likes: any
  suggested_sort: string
  banned_at_utc: any
  url_overridden_by_dest: string
  view_count: any
  archived: boolean
  no_follow: boolean
  is_crosspostable: boolean
  pinned: boolean
  over_18: boolean
  preview: any
  all_awardings: any[]
  awarders: any[]
  media_only: boolean
  link_flair_template_id: string
  can_gild: boolean
  spoiler: boolean
  locked: boolean
  author_flair_text: string
  treatment_tags: any[]
  visited: boolean
  removed_by: any
  mod_note: any
  distinguished: any
  subreddit_id: string
  author_is_blocked: boolean
  mod_reason_by: any
  num_reports: any
  removal_reason: any
  link_flair_background_color: string
  id: string
  is_robot_indexable: boolean
  num_duplicates: number
  report_reasons: any
  author: string
  discussion_type: any
  num_comments: number
  send_replies: boolean
  media: null | Media
  contest_mode: boolean
  author_patreon_flair: boolean
  author_flair_text_color: string
  permalink: string
  whitelist_status: string
  stickied: boolean
  url: string
  subreddit_subscribers: number
  created_utc: number
  num_crossposts: number
  mod_reports: any[]
  is_video: boolean
}

type ChildrenPostData = {
  kind: string
  data: ActualPostData
}

type PostData = {
  after: string | null
  dist: number
  modhash: any
  geo_filter: any
  before: string | null
  children: [ChildrenPostData]
}

type PostContainer = {
  kind: string
  data: PostData
}

type ActualCommentsData = {
  subreddit_id: string
  approved_at_utc: any
  author_is_blocked: boolean
  comment_type: any
  awarders: any[]
  mod_reason_by: any
  banned_by: any
  author_flair_type: string
  total_awards_received: number
  subreddit: string
  author_flair_template_id: any
  likes: any
  replies: CommentsContainer
  user_reports: any[]
  saved: boolean
  id: string
  banned_at_utc: any
  mod_reason_title: any
  gilded: number
  archived: boolean
  collapsed_reason_code: any
  no_follow: boolean
  author: string
  can_mod_post: boolean
  created_utc: number
  send_replies: boolean
  parent_id: string
  score: number
  author_fullname: string
  approved_by: any
  mod_note: any
  all_awardings: any[]
  collapsed: boolean
  body: string
  edited: boolean
  top_awarded_type: any
  author_flair_css_class: any
  name: string
  is_submitter: boolean
  downs: number
  author_flair_richtext: any[]
  author_patreon_flair: boolean
  body_html: string
  removal_reason: any
  collapsed_reason: any
  distinguished: any
  associated_award: any
  stickied: boolean
  author_premium: boolean
  can_gild: boolean
  gildings: any
  unrepliable_reason: any
  author_flair_text_color: any
  score_hidden: boolean
  permalink: string
  subreddit_type: string
  locked: boolean
  report_reasons: any
  created: number
  author_flair_text: any
  treatment_tags: any[]
  link_id: string
  subreddit_name_prefixed: string
  controversiality: number
  depth: number
  author_flair_background_color: any
  collapsed_because_crowd_control: any
  mod_reports: any[]
  num_reports: any
  ups: number
}

type CommentsPostData = {
  kind: string
  data: ActualCommentsData
}

type CommentsData = {
  after: string | null
  dist: number
  modhash: any
  geo_filter: any
  before: string | null
  children: [CommentsPostData]
}

type CommentsContainer = {
  kind: string
  data: CommentsData
}

type StructuredComments = [PostContainer, CommentsContainer]

export { Comments, StructuredComments }
