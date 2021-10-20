import * as R from 'ramda'
import { FastifyReply, FastifyRequest } from 'fastify'
import { DateTime } from 'luxon'

import { db } from '../../../db/db'
import { Post } from '../../../db/entities/Posts/Post'
import { findAnyMediaFilesForPosts, PostWithDownloadedFiles } from './find-posts-media-files'
import { genPrettyDateCreatedAgoFromUTC } from './pretty-date-created-ago'

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
  posts?: PostWithDownloadedFilesAndPrettyDate[]
  subreddit: string
}

const postsPerPage = 30

function addPaginationDataToTemplateLocals(
  reply: FastifyReplyWithLocals,
  { rows: pageWorthOfPosts, count: totalResults }: { rows: Post[]; count: number },
  pageNumber: number
): Post[] {
  reply.locals.pageNumber = pageNumber
  reply.locals.pagination = Math.ceil(totalResults / postsPerPage)
  reply.locals.totalResults = totalResults

  return pageWorthOfPosts
}

type PostWithDownloadedFilesAndPrettyDate = PostWithDownloadedFiles & {
  prettyDateCreated: string
  prettyDateCreatedAgo: string
}

/*****
  created_utc is a unix timestamp, which is in seconds, not milliseconds.
  We need to use { zone: 'Etc/UTC' } as that is where created_utc is set.
*****/
const addPrettyDatesForEachPost = R.map(
  (post: PostWithDownloadedFiles): PostWithDownloadedFilesAndPrettyDate => ({
    ...post,
    prettyDateCreated: DateTime.fromSeconds(post.created_utc, { zone: 'Etc/UTC' }).toFormat(
      'yyyy LLL dd, h:mm a'
    ),

    prettyDateCreatedAgo: genPrettyDateCreatedAgoFromUTC(post.created_utc),
  })
)

const saveFinalizedPostsDataToTemplateLocals = R.curry(
  (reply: FastifyReplyWithLocals, posts: PostWithDownloadedFilesAndPrettyDate[]) => {
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
    .then(addPrettyDatesForEachPost)
    .then(saveFinalizedPostsDataToTemplateLocals(replyWithLocals))
}

const removePaginationDataFromDBResponse = R.prop('rows')

async function infiniteScrollGetMorePosts(
  request: FastifyRequest
): Promise<PostWithDownloadedFilesAndPrettyDate[]> {
  const query = request.query as Query
  const params = request.params as Params
  const pageNumber = query.page ? Number(query.page) : 1
  const { subreddit } = params
  const { topFilter } = query
  const user = request.cookies['loggedInUser'] as string

  return subreddit
    ? db
        .getPostsPaginatedForSubreddit(subreddit, pageNumber, topFilter)
        .then(removePaginationDataFromDBResponse)
        .then(findAnyMediaFilesForPosts)
        .then(addPrettyDatesForEachPost)
    : db
        .getPostsPaginatedForAllSubsOfUser(user, pageNumber, topFilter)
        .then(removePaginationDataFromDBResponse)
        .then(findAnyMediaFilesForPosts)
        .then(addPrettyDatesForEachPost)
}

export { getPostsPaginated, getPostsPaginatedForSubreddit, infiniteScrollGetMorePosts }
