import { Property, PrimaryKey, Entity } from '@mikro-orm/core'

@Entity()
export class Comments {
  @PrimaryKey({ columnType: 'text' })
  postId!: string

  @Property({ columnType: 'text' })
  comments!: string
}
