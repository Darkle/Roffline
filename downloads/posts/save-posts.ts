import * as R from 'ramda'

import { db } from '../../db/db'
import type { Post } from '../../db/entities/Posts/Post'
import type { FeedWithData } from '../feeds/generate-feeds'

const postDataToKeep = [
  'id',
  'subreddit',
  'author',
  'title',
  'selftext',
  'selftext_html',
  'score',
  'is_self',
  'stickied',
  'created_utc',
  'domain',
  'is_video',
  'post_hint',
  'permalink',
  'url',
  'media',
  'crosspost_parent',
]

const filterDuplicatePosts = R.uniqBy(R.path(['id']))

const getEachPostsData = R.map(R.compose(R.pick(postDataToKeep), R.path(['data'])))

const getPostsFromFeedItem = R.map(R.path(['data', 'children']))

const collateAndDedupeAllPostsFromAllFeeds = R.compose(
  filterDuplicatePosts,
  getEachPostsData,
  R.flatten,
  getPostsFromFeedItem
)

function savePosts({
  subsFeedsData,
  subsUpdated,
}: {
  subsFeedsData: FeedWithData[]
  subsUpdated: string[]
}): Promise<string[]> {
  const allPostsFromTheSubsFeedsWhichIncludesDuplicatePosts: FeedWithData[] = subsFeedsData

  const allPostsFromTheSubsFeedsSansDuplicates = collateAndDedupeAllPostsFromAllFeeds(
    allPostsFromTheSubsFeedsWhichIncludesDuplicatePosts
  ) as Post[]

  return db.batchAddNewPosts(allPostsFromTheSubsFeedsSansDuplicates).then(() => subsUpdated)
}

export { savePosts }
