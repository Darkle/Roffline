import { Op } from 'sequelize'
import DateTime from 'date-fns'

import { Post, PostModel } from './entities/Posts'

const postsPerPage = 30

type DefaultFindOptions = {
  offset?: number
  limit: number
  order: string[]
}
type TopFilterType = 'day' | 'week' | 'month' | 'year' | 'all'

/*****
  `created_utc` is a unix timestamp (ie the number of seconds since the epoch)
*****/

const genDefaultFindOptions = (page: number, offset: number): DefaultFindOptions =>
  page === 1
    ? { limit: postsPerPage, order: ['created_utc', 'DESC'] }
    : { offset, limit: postsPerPage, order: ['created_utc', 'DESC'] }

const formatFindAllAndCountResponse = (resp: {
  count: number
  rows: PostModel[]
}): { count: number; rows: Post[] } => ({
  count: resp.count,
  rows: resp.rows.map(item => item.get() as Post),
})

function getPostsPaginated(page: number): Promise<{ count: number; rows: Post[] }> {
  const offset = (page - 1) * postsPerPage

  return PostModel.findAndCountAll({ ...genDefaultFindOptions(page, offset) }).then(formatFindAllAndCountResponse)
}

const getFilteredTimeAsUnixTimestamp = (topFilter: string): number =>
  Math.round(DateTime.getUnixTime(DateTime.sub(new Date(), { [`${topFilter}s`]: 1 })))

function getTopPostsPaginated(page: number, topFilter: TopFilterType): Promise<{ count: number; rows: Post[] }> {
  const offset = (page - 1) * postsPerPage
  const filterTime = topFilter === 'all' ? 0 : getFilteredTimeAsUnixTimestamp(topFilter)

  return PostModel.findAndCountAll({
    where: {
      created_utc: {
        [Op.gt]: filterTime,
      },
    },
    ...genDefaultFindOptions(page, offset),
  }).then(formatFindAllAndCountResponse)
}

function getPostsPaginatedForSubreddit(
  subreddit: string,
  page: number
): Promise<{ count: number; rows: Post[] }> {
  const offset = (page - 1) * postsPerPage

  return PostModel.findAndCountAll({ where: { subreddit }, ...genDefaultFindOptions(page, offset) }).then(
    formatFindAllAndCountResponse
  )
}

function getTopPostsPaginatedForSubreddit(
  subreddit: string,
  page: number,
  topFilter: string
): Promise<{ count: number; rows: Post[] }> {
  const offset = (page - 1) * postsPerPage
  const filterTime = topFilter === 'all' ? 0 : getFilteredTimeAsUnixTimestamp(topFilter)

  return PostModel.findAndCountAll({
    where: {
      subreddit,
      created_utc: {
        [Op.gt]: filterTime,
      },
    },
    ...genDefaultFindOptions(page, offset),
  }).then(formatFindAllAndCountResponse)
}

export {
  getPostsPaginated,
  getTopPostsPaginated,
  getPostsPaginatedForSubreddit,
  getTopPostsPaginatedForSubreddit,
}
