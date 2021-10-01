import { Sequelize, QueryTypes } from 'sequelize'

// import { Post } from './entities/Posts'

const postsPerPage = 30

type SearchLimitedPostType = {
  title: string
  postId: string
  score: number
  subreddit: string
  created_utc: number
  author: string
  permalink: string
}
type SearchReturnType = [rows: SearchLimitedPostType[], count: [{ count: number }]]

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

  // eslint-disable-next-line max-lines-per-function
  return sequelize.transaction(transaction =>
    Promise.all([
      sequelize.query(
        `SELECT title, postId, score, subreddit, created_utc, author, permalink FROM posts WHERE (' ' || title || ' ') LIKE ? LIMIT ? ${
          page > 1 ? 'OFFSET ?' : ''
        }`,
        {
          replacements: sqlBindings,
          transaction,
          raw: true,
          type: QueryTypes.SELECT,
        }
      ),
      sequelize.query("SELECT COUNT(postId) as `count` from posts WHERE (' ' || title || ' ') LIKE ?", {
        replacements: [searchTermSQL],
        transaction,
        raw: true,
        type: QueryTypes.SELECT,
      }),
      // @ts-expect-errors typescript interprets the argument type here as [object[], object[]]
    ]).then(([rows, count]: SearchReturnType): { rows: SearchLimitedPostType[]; count: number } => ({
      rows,
      ...(count[0] as { count: number }),
    }))
  )
}

export { searchPosts, SearchLimitedPostType }
