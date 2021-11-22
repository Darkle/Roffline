import * as R from 'ramda'

import { db } from '../../db/db'
import { Post } from '../../db/entities/Posts/Post'
import { FeedWithData } from '../feeds/generate-feeds'

const postDataToKeep = [
  'id',
  'subreddit',
  'author',
  'title',
  'selftext',
  'selftext_html',
  'score',
  'is_reddit_media_domain',
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

// eslint-disable-next-line max-lines-per-function
function savePosts(allPostsFromTheSubsFeedsWhichIncludesDuplicatePosts: FeedWithData[]): Promise<string[]> {
  const subsWeUpdated = R.uniq(
    allPostsFromTheSubsFeedsWhichIncludesDuplicatePosts.map(
      (feedData: FeedWithData): string => feedData.subreddit
    )
  )

  console.log(
    `feeds posts with duplicates length:${
      R.compose(
        filterDuplicatePosts,
        getEachPostsData,
        R.flatten,
        getPostsFromFeedItem
      )(allPostsFromTheSubsFeedsWhichIncludesDuplicatePosts).length
    }`
  )

  const allPostsFromTheSubsFeedsSansDuplicates = collateAndDedupeAllPostsFromAllFeeds(
    allPostsFromTheSubsFeedsWhichIncludesDuplicatePosts
  ) as Post[]

  console.log(`allPostsFromAllFeedsSansDuplicates length:${allPostsFromTheSubsFeedsSansDuplicates.length}`)

  return db.batchAddNewPosts(allPostsFromTheSubsFeedsSansDuplicates).then(() => subsWeUpdated)
}

export { savePosts }
