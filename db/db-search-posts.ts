import { Sequelize, QueryTypes } from 'sequelize'

// import { Post } from './entities/Posts'

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
type SearchReturnType = [SearchLimitedPostType[], [[{ count: number }], unknown]]

/*****
  Inspired by https://stackoverflow.com/a/16450642/2785644
*****/
// eslint-disable-next-line max-lines-per-function
function searchPosts(
  sequelize: Sequelize,
  searchTerm: string,
  page: number,
  fuzzySearch: boolean
): Promise<{ rows: SearchLimitedPostType[]; count: number }> {
  const offset = (page - 1) * postsPerPage
  const searchTermSQL = fuzzySearch ? `%${searchTerm}%` : `% ${searchTerm} %`
  const sqlBindings = page > 1 ? [searchTermSQL, postsPerPage, offset] : [searchTermSQL, postsPerPage]

  return sequelize.transaction(
    // eslint-disable-next-line max-lines-per-function
    transaction =>
      Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        sequelize.query(
          `SELECT title, id, score, subreddit, created_utc, author, permalink FROM posts WHERE (' ' || title || ' ') LIKE ? LIMIT ? ${
            page > 1 ? 'OFFSET ?' : ''
          }`,
          {
            replacements: sqlBindings,
            transaction,
            raw: true,
            type: QueryTypes.SELECT,
          }
        ) as Promise<SearchLimitedPostType[]>,
        sequelize.query("SELECT COUNT(id) as `count` from posts WHERE (' ' || title || ' ') LIKE ?", {
          replacements: [searchTermSQL],
          transaction,
          raw: true,
          type: QueryTypes.SELECT,
        }) as Promise<[[{ count: number }], unknown]>,
      ]).then(
        ([rows, count]: SearchReturnType): {
          rows: SearchLimitedPostType[]
          count: number
        } => ({
          rows,
          count: count[0][0].count,
        })
      )
  )
}

export { searchPosts, SearchLimitedPostType }
