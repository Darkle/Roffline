import { Property, PrimaryKey, Entity } from '@mikro-orm/core'

@Entity()
export class UpdatesTracker {
  @PrimaryKey()
  id!: number // auto increment PK in SQL drivers

  @Property({ columnType: 'text' })
  lastUpdateDateAsString!: string
}
