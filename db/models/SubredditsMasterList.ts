import { Entity, PrimaryColumn } from 'typeorm'

@Entity()
export class SubredditsMasterList {
  @PrimaryColumn({
    collation: 'NOCASE',
    type: 'text',
  })
  subreddit: string
}
