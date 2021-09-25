import { PrimaryKey, Entity } from '@mikro-orm/core'

@Entity()
export class FeedsToFetch {
  @PrimaryKey({ columnType: 'text' })
  feed!: string
}
