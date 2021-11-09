import * as R from 'ramda'
import { Timer } from 'timer-node'
import { Op, Sequelize, Transaction } from 'sequelize'

import { SubredditTable, TopPostsRowType, subredditTablesMap } from '../entities/SubredditTable'
import { Post, PostWithComments } from '../entities/Posts/Post'
import { PostModel } from '../entities/Posts/Posts'
import { dbLogger } from '../../logging/logging'
import { CommentContainer } from '../entities/Comments'

type SubsPostsIdDataType = {
  [subreddit: string]: TopPostsRowType[]
}

type TransactionType = Transaction | null | undefined

function getSinglePostData(
  getPostComments: (postId: string) => Promise<CommentContainer[] | [] | null>,
  postId: string
): Promise<PostWithComments> {
  return Promise.all([
    PostModel.findByPk(postId).then(post => post?.get() as Post),
    getPostComments(postId),
  ]).then(([postData, commentsData]) => {
    const post = postData as PostWithComments
    post.comments = commentsData
    return post
  })
}

function getAllPostIds(): Promise<string[]> {
  return PostModel.findAll({ attributes: ['id'] }).then(items => items.map(item => item.get('id') as string))
}

function getPostIdsWithNoCommentsYetFetched(): Promise<string[]> {
  return PostModel.findAll({ where: { commentsDownloaded: false }, attributes: ['id'] }).then(items =>
    items.map(item => item.get('id') as string)
  )
}

function getPostsWithMediaStillToDownload(): Promise<Post[]> {
  return PostModel.findAll({ where: { media_has_been_downloaded: false }, attributes: ['id'] }).then(items =>
    items.map(item => item.get() as Post)
  )
}

function getCountOfAllPostsWithMediaStillToDownload(): Promise<number> {
  return PostModel.count({ where: { media_has_been_downloaded: false }, attributes: ['id'] })
}

async function setMediaDownloadedTrueForPost(postId: string): Promise<void> {
  await PostModel.update({ media_has_been_downloaded: true }, { where: { id: postId } })
}

async function incrementPostMediaDownloadTry(postId: string): Promise<void> {
  await PostModel.increment('mediaDownloadTries', { where: { id: postId } })
}

type PostIds = string[]

async function batchRemovePosts(postsToRemove: PostIds, transaction: TransactionType = null): Promise<void> {
  const timer = new Timer()
  timer.start()

  await PostModel.destroy({ where: { id: { [Op.in]: postsToRemove } }, transaction })

  dbLogger.debug(
    `db.batchRemovePosts for ${postsToRemove.length} posts and their comments took ${timer.format(
      '[%s] seconds [%ms] ms'
    )} to complete`
  )

  timer.clear()
}

// eslint-disable-next-line max-lines-per-function
async function batchAddNewPosts(sequelize: Sequelize, postsToAdd: Post[]): Promise<void> {
  // eslint-disable-next-line functional/no-conditional-statement
  if (R.isEmpty(postsToAdd)) return Promise.resolve()

  const timer = new Timer()
  timer.start()

  const postsInDB: string[] = await sequelize.transaction(transaction =>
    PostModel.findAll({ attributes: ['id'], transaction }).then(items =>
      items.map(item => item.get('id') as string)
    )
  )

  const numNewPostsSansExisting = R.differenceWith(
    (x: Post, postId: string) => x.id === postId,
    postsToAdd,
    postsInDB
  ).length

  await PostModel.bulkCreate(postsToAdd, { ignoreDuplicates: true, validate: true })

  dbLogger.debug(
    `db.batchAddNewPosts for ${numNewPostsSansExisting} posts (${postsToAdd.length} total) took ${timer.format(
      '[%s] seconds [%ms] ms'
    )} to complete`
  )

  timer.clear()
}

async function batchAddSubredditsPostIdReferences(
  sequelize: Sequelize,
  subsPostsIdRefs: SubsPostsIdDataType
): Promise<void> {
  await sequelize.transaction(transaction =>
    Promise.all(
      Object.keys(subsPostsIdRefs).map(subreddit =>
        subredditTablesMap
          .get(subreddit.toLowerCase())
          ?.bulkCreate(subsPostsIdRefs[subreddit] as SubredditTable[], { ignoreDuplicates: true, transaction })
      )
    )
  )
}

async function batchClearSubredditsPostIdReferences(sequelize: Sequelize, subs: string[]): Promise<void> {
  await sequelize.transaction(transaction =>
    Promise.all(subs.map(sub => subredditTablesMap.get(sub.toLowerCase())?.truncate({ transaction })))
  )
}

export {
  getSinglePostData,
  getAllPostIds,
  getPostIdsWithNoCommentsYetFetched,
  getPostsWithMediaStillToDownload,
  getCountOfAllPostsWithMediaStillToDownload,
  setMediaDownloadedTrueForPost,
  incrementPostMediaDownloadTry,
  batchRemovePosts,
  batchAddNewPosts,
  batchAddSubredditsPostIdReferences,
  batchClearSubredditsPostIdReferences,
}
