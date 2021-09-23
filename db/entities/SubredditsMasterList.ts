import { Entity, PrimaryColumn, BaseEntity } from 'typeorm'

@Entity()
export class SubredditsMasterList extends BaseEntity {
  @PrimaryColumn({
    collation: 'NOCASE',
    type: 'text',
  })
  subreddit: string
}
