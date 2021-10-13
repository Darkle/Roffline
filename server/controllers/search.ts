import { FastifyReply, FastifyRequest } from 'fastify'

import { db } from '../../db/db'
import { SearchLimitedPostType } from '../../db/db-search-posts'

type Query = {
  page?: number
  searchTerm?: string
  fuzzySearch?: boolean
}

type FastifyReplyWithLocals = {
  locals: Locals
} & FastifyReply

type Locals = {
  searchTerm?: string
  fuzzySearch?: boolean
  searchResults: SearchLimitedPostType[]
  pageNumber?: number
  pagination?: number
  totalResults: number
}

const resultsPerPage = 30

/* eslint-disable no-param-reassign */
const addResultsDataToTemplateLocals = (
  replyWithLocals: FastifyReplyWithLocals,
  pageNumber: number,
  { rows: pageWorthOfPosts, count }: { rows: SearchLimitedPostType[]; count: number }
): void => {
  replyWithLocals.locals.searchResults = pageWorthOfPosts
  replyWithLocals.locals.pageNumber = pageNumber
  replyWithLocals.locals.totalResults = count
  replyWithLocals.locals.pagination = Math.ceil(count / resultsPerPage)
}
/* eslint-enable no-param-reassign */

async function searchPosts(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const replyWithLocals = reply as FastifyReplyWithLocals
  const query = request.query as Query
  const pageNumber = query.page ? Number(query.page) : 1
  const { searchTerm } = query
  const { fuzzySearch } = query
  const user = request.cookies['loggedInUser'] as string

  // eslint-disable-next-line functional/no-conditional-statement
  if (!searchTerm) return
  // eslint-disable-next-line functional/no-conditional-statement
  if (fuzzySearch) replyWithLocals.locals.fuzzySearch = true

  replyWithLocals.locals.searchTerm = searchTerm

  await db
    .searchPosts(user, searchTerm, pageNumber, fuzzySearch)
    .then(results => addResultsDataToTemplateLocals(replyWithLocals, pageNumber, results))
}

export { searchPosts }
