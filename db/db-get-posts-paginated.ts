import { Op } from 'sequelize'
import { DateTime } from 'luxon'

import { Post, PostModel } from './entities/Posts'

const postsPerPage = 30

type TopFilterType = 'day' | 'week' | 'month' | 'year' | 'all'

/*****
  `created_utc` is a unix timestamp (ie the number of seconds since the epoch)
*****/

const formatFindAllAndCountResponse = (resp: {
  count: number
  rows: PostModel[]
}): { count: number; rows: Post[] } => ({
  count: resp.count,
  rows: resp.rows.map(item => item.get() as Post),
})

function getPostsPaginated(page: number): Promise<{ count: number; rows: Post[] }> {
  const offset = (page - 1) * postsPerPage

  return PostModel.findAndCountAll({ offset, limit: postsPerPage, order: [['created_utc', 'DESC']] }).then(
    formatFindAllAndCountResponse
  )
}

const getFilteredTimeAsUnixTimestamp = (topFilter: string): number =>
  Math.round(
    DateTime.now()
      .minus({ [topFilter]: 1 })
      .toSeconds()
  )

function getTopPostsPaginated(page: number, topFilter: TopFilterType): Promise<{ count: number; rows: Post[] }> {
  const offset = (page - 1) * postsPerPage
  const filterTime = topFilter === 'all' ? 0 : getFilteredTimeAsUnixTimestamp(topFilter)

  return PostModel.findAndCountAll({
    where: {
      created_utc: {
        [Op.gt]: filterTime,
      },
    },
    offset,
    limit: postsPerPage,
    order: [['created_utc', 'DESC']],
  }).then(formatFindAllAndCountResponse)
}

function getPostsPaginatedForSubreddit(
  subreddit: string,
  page: number
): Promise<{ count: number; rows: Post[] }> {
  const offset = (page - 1) * postsPerPage

  return PostModel.findAndCountAll({
    where: { subreddit },
    offset,
    limit: postsPerPage,
    order: [['created_utc', 'DESC']],
  }).then(formatFindAllAndCountResponse)
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
    offset,
    limit: postsPerPage,
    order: [['created_utc', 'DESC']],
  }).then(formatFindAllAndCountResponse)
}

export {
  getPostsPaginated,
  getTopPostsPaginated,
  getPostsPaginatedForSubreddit,
  getTopPostsPaginatedForSubreddit,
}
