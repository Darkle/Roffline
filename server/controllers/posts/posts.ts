import * as R from 'ramda'
import { FastifyReply, FastifyRequest } from 'fastify'
import { DateTime } from 'luxon'
import jsAgo from 'js-ago'

import { db } from '../../../db/db'
import { Post } from '../../../db/entities/Posts/Post'
import { findAnyMediaFilesForPosts, PostWithDownloadedFiles } from './find-posts-media-files'
import { createPostContentHtml } from './create-post-content-html'

type FastifyReplyWithLocals = {
  locals: Locals
} & FastifyReply

type TopFilterType = 'day' | 'week' | 'month' | 'year' | 'all'

type Query = {
  topFilter?: TopFilterType
  page?: number
}

type Params = {
  subreddit: string
}

type Locals = {
  topFilter?: TopFilterType
  pageNumber?: number
  pagination?: number
  totalResults?: number
  posts?: PostWithPostContentAndDownloadedFilesAndPrettyDate[]
  subreddit: string
}

type PostWithPostContentAndDownloadedFiles = PostWithDownloadedFiles & { postContent: string }

const postsPerPage = 30

const createPostContentHtmlForPosts = R.map(
  (post: PostWithDownloadedFiles): PostWithPostContentAndDownloadedFiles => ({
    ...post,
    postContent: createPostContentHtml(post) as string,
  })
)

function addPaginationDataToTemplateLocals(
  reply: FastifyReplyWithLocals,
  { rows: pageWorthOfPosts, count }: { rows: Post[]; count: number },
  pageNumber: number
): Post[] {
  reply.locals.pageNumber = pageNumber
  reply.locals.pagination = Math.ceil(count / postsPerPage)
  reply.locals.totalResults = count

  return pageWorthOfPosts
}

type PostWithPostContentAndDownloadedFilesAndPrettyDate = PostWithPostContentAndDownloadedFiles & {
  prettyDateCreated: string
  prettyDateCreatedAgo: string
}

// created_utc is in seconds, not milliseconds
const addPrettyDatesForEachPost = R.map(
  (post: PostWithPostContentAndDownloadedFiles): PostWithPostContentAndDownloadedFilesAndPrettyDate => ({
    ...post,
    prettyDateCreated: DateTime.fromSeconds(post.created_utc).toFormat('yyyy LLL dd, h:mm a'),
    prettyDateCreatedAgo: jsAgo(post.created_utc),
  })
)

const saveFinalizedPostsDataToTemplateLocals = R.curry(
  (reply: FastifyReplyWithLocals, posts: PostWithPostContentAndDownloadedFilesAndPrettyDate[]) => {
    reply.locals.posts = posts
  }
)

async function getPostsPaginated(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const query = request.query as Query
  const pageNumber = query.page ? Number(query.page) : 1
  const { topFilter } = query
  const user = request.cookies['loggedInUser'] as string
  const replyWithLocals = reply as FastifyReplyWithLocals

  // eslint-disable-next-line functional/no-conditional-statement
  if (topFilter) {
    replyWithLocals.locals.topFilter = topFilter
  }

  await db
    .getPostsPaginatedForAllSubsOfUser(user, pageNumber, topFilter)
    .then(results => addPaginationDataToTemplateLocals(replyWithLocals, results, pageNumber))
    .then(findAnyMediaFilesForPosts)
    .then(createPostContentHtmlForPosts)
    .then(addPrettyDatesForEachPost)
    .then(saveFinalizedPostsDataToTemplateLocals(replyWithLocals))
}

async function getPostsPaginatedForSubreddit(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const query = request.query as Query
  const params = request.params as Params
  const pageNumber = query.page ? Number(query.page) : 1
  const { subreddit } = params
  const { topFilter } = query
  const replyWithLocals = reply as FastifyReplyWithLocals

  // eslint-disable-next-line functional/no-conditional-statement
  if (topFilter) {
    replyWithLocals.locals.topFilter = topFilter
  }

  await db
    .getPostsPaginatedForSubreddit(subreddit, pageNumber, topFilter)
    .then(results => addPaginationDataToTemplateLocals(replyWithLocals, results, pageNumber))
    .then(findAnyMediaFilesForPosts)
    .then(createPostContentHtmlForPosts)
    .then(addPrettyDatesForEachPost)
    .then(saveFinalizedPostsDataToTemplateLocals(replyWithLocals))
}

export {
  getPostsPaginated,
  getPostsPaginatedForSubreddit,
  createPostContentHtmlForPosts,
  PostWithPostContentAndDownloadedFilesAndPrettyDate,
}
