import { Entity, PrimaryColumn, BaseEntity } from 'typeorm'

@Entity()
export class FeedsToFetch extends BaseEntity {
  @PrimaryColumn({ type: 'text' })
  feed: string
}
