import { PrimaryKey, Entity } from '@mikro-orm/core'

@Entity()
export class SubredditsMasterList {
  @PrimaryKey({ columnType: 'text' })
  subreddit!: string
}
