import { Entity, PrimaryColumn } from 'typeorm'

@Entity()
export class FeedsToFetch {
  @PrimaryColumn()
  feed: string
}
