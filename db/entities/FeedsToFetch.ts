import { Entity, PrimaryColumn } from 'typeorm'

@Entity()
export class FeedsToFetch {
  @PrimaryColumn({ type: 'text' })
  feed: string
}
