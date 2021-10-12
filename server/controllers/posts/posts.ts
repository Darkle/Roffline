import { FastifyReply, FastifyRequest } from 'fastify'

import { db } from '../../../db/db'
import { Post } from '../../../db/entities/Posts'
import { findAnyMediaFilesForPosts } from './find-posts-media-files'

// eslint-disable-next-line functional/prefer-type-literal
interface FastifyReplyWithLocals extends FastifyReply {
  locals: Locals
}

type TopFilterType = 'day' | 'week' | 'month' | 'year' | 'all'

type Query = {
  topFilter?: TopFilterType
  page?: number
}

type Locals = {
  topFilter?: TopFilterType
  pageNumber?: number
  pagination?: number
}

const postsPerPage = 30

function addPaginationDataToTemplateLocals(
  reply: FastifyReply,
  { rows: pageWorthOfPosts, count }: { rows: Post[]; count: number },
  pageNumber: number
): Post[] {
  // eslint-disable-next-line functional/immutable-data,@typescript-eslint/no-extra-semi
  ;(reply as FastifyReplyWithLocals).locals = {
    pageNumber,
    pagination: Math.ceil(count / postsPerPage),
  }

  return pageWorthOfPosts
}

function getPostsPaginated(request: FastifyRequest, reply: FastifyReply): void {
  const query = request.query as Query
  const pageNumber = query.page ? Number(query.page) : 1
  const { topFilter } = query
  const user = request.cookies['loggedInUser'] as string

  // eslint-disable-next-line functional/no-conditional-statement
  if (topFilter) {
    // eslint-disable-next-line functional/immutable-data,@typescript-eslint/no-extra-semi
    ;(reply as FastifyReplyWithLocals).locals = { topFilter }
  }

  db.getPostsPaginatedForAllSubsOfUser(user, pageNumber, topFilter)
    .then(results => addPaginationDataToTemplateLocals(reply, results, pageNumber))
    .then(findAnyMediaFilesForPosts)
    .then(createPostContentHtmlForPosts)
  // .then(addPrettyDatesForEachPost)
  // .then(savePostsDataToTemplateLocals(res))
  // .then(next)
  // .catch(next)
}

export { getPostsPaginated }
