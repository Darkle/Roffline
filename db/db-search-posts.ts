import { Sequelize, QueryTypes } from 'sequelize'
import { User } from './entities/Users/User'
import { UserModel } from './entities/Users/Users'

const postsPerPage = 30

type SearchLimitedPostType = {
  title: string
  id: string
  score: number
  subreddit: string
  created_utc: number
  author: string
  permalink: string
}
type SearchReturnType = [SearchLimitedPostType[], [{ count: number }]]

/*****
  Inspired by https://stackoverflow.com/a/16450642/2785644
*****/
// eslint-disable-next-line max-lines-per-function
function searchPosts({
  userName,
  sequelize,
  searchTerm,
  page,
  fuzzySearch,
}: {
  userName: string
  sequelize: Sequelize
  searchTerm: string
  page: number
  fuzzySearch: boolean
}): Promise<{ rows: SearchLimitedPostType[]; count: number }> {
  const offset = (page - 1) * postsPerPage
  const searchTermSQL = fuzzySearch ? `%${searchTerm}%` : `% ${searchTerm} %`
  const sqlBindings = page > 1 ? [searchTermSQL, postsPerPage, offset] : [searchTermSQL, postsPerPage]

  return sequelize.transaction(
    // eslint-disable-next-line max-lines-per-function
    transaction =>
      UserModel.findOne({ where: { name: userName }, attributes: ['subreddits'], transaction })
        .then(user => user?.get('subreddits') as User[keyof User])
        // eslint-disable-next-line max-lines-per-function
        .then(subredits =>
          Promise.all([
            sequelize.query(
              `SELECT title, id, score, subreddit, created_utc, author, permalink FROM posts WHERE subreddit in (?) AND (' ' || title || ' ') LIKE ? LIMIT ? ${
                page > 1 ? 'OFFSET ?' : ''
              }`,
              {
                replacements: [subredits.toString(), sqlBindings],
                transaction,
                raw: true,
                type: QueryTypes.SELECT,
              }
            ) as Promise<SearchLimitedPostType[]>,
            sequelize.query(
              "SELECT COUNT(id) as `count` from posts WHERE subreddit in (?) AND (' ' || title || ' ') LIKE ?",
              {
                replacements: [subredits.toString(), sqlBindings],
                transaction,
                raw: true,
                type: QueryTypes.SELECT,
              }
            ) as Promise<[{ count: number }]>,
          ])
        )
        .then(
          ([rows, count]: SearchReturnType): {
            rows: SearchLimitedPostType[]
            count: number
          } => ({
            rows,
            count: count[0].count,
          })
        )
  )
}

export { searchPosts, SearchLimitedPostType }
