/*****
  We dont create this as a class as that would create a table on syncronize.
  ATM, TypeORM doesnt seem to have a way to use EntityManager with dynamically created tables.
  https://stackoverflow.com/questions/57459643/
  So we need to create/query/update the dynamically created Subreddit tables using createQueryBuilder.
*****/
type SubredditTable = {
  posts_Default: string | null
  topPosts_Day: string | null
  topPosts_Week: string | null
  topPosts_Month: string | null
  topPosts_Year: string | null
  topPosts_All: string | null
}

export { SubredditTable }
