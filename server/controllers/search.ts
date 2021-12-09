import type { FastifyReply, FastifyRequest } from 'fastify'
import { DateTime } from 'luxon'

import { db } from '../../db/db'
import type { SearchLimitedPostType } from '../../db/posts/db-search-posts'
import { genPrettyDateCreatedAgoFromUTC } from './posts/pretty-date-created-ago'

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

type SearchResults = { rows: SearchLimitedPostType[]; count: number }

type SearchResultsWithPrettyDates = { rows: SearchLimitedPostTypeWithPrettyDates[]; count: number }

type SearchLimitedPostTypeWithPrettyDates = SearchLimitedPostType & {
  prettyDateCreated: string
  prettyDateCreatedAgo: string
}

/*****
  created_utc is a unix timestamp, which is in seconds, not milliseconds.
  We need to use { zone: 'Etc/UTC' } as that is where created_utc is set.
*****/
function addPrettyDatesForEachResult(results: SearchResults): SearchResultsWithPrettyDates {
  // eslint-disable-next-line functional/immutable-data,no-param-reassign
  results.rows = results.rows.map(post => ({
    ...post,
    prettyDateCreated: DateTime.fromSeconds(post.created_utc, { zone: 'Etc/UTC' }).toFormat(
      'yyyy LLL dd, h:mm a'
    ),

    prettyDateCreatedAgo: genPrettyDateCreatedAgoFromUTC(post.created_utc),
  }))

  return results as SearchResultsWithPrettyDates
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
    .then(addPrettyDatesForEachResult)
    .then(results => addResultsDataToTemplateLocals(replyWithLocals, pageNumber, results))
}

export { searchPosts }
