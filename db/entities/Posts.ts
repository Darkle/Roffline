import { Property, PrimaryKey, Entity, OneToOne, Cascade } from '@mikro-orm/core'

import { Comments } from './Comments'

@Entity({ tableName: 'posts' })
export class Post {
  @PrimaryKey({ columnType: 'text' })
  postId!: string

  // Remove the corresponding comments row from Comments table
  @OneToOne({ entity: () => Comments, eager: false, cascade: [Cascade.REMOVE], owner: true, orphanRemoval: true })
  comments?: Comments

  @Property({ columnType: 'text' })
  subreddit!: string

  @Property({ columnType: 'text' })
  author!: string

  @Property({ columnType: 'text' })
  title!: string

  @Property({ columnType: 'text', nullable: true, default: null })
  selftext?: string

  @Property({ columnType: 'text', nullable: true, default: null })
  selftext_html?: string

  @Property()
  score!: number

  @Property({ default: false })
  is_reddit_media_domain!: boolean

  @Property({ default: false })
  is_self!: boolean

  @Property()
  created_utc!: number

  @Property({ columnType: 'text' })
  domain!: string

  @Property({ default: false })
  is_video!: boolean

  @Property({ default: false })
  stickied!: boolean

  @Property({ default: false })
  media_has_been_downloaded!: boolean

  @Property({ default: 0 })
  mediaDownloadTries!: number

  @Property({ columnType: 'text', nullable: true, default: null })
  post_hint?: string

  @Property({ columnType: 'text' })
  permalink!: string

  @Property({ columnType: 'text' })
  url!: string

  @Property({ columnType: 'text', nullable: true, default: null })
  media?: string

  @Property({ columnType: 'text', nullable: true, default: null })
  crosspost_parent?: string
}
