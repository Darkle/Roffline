import { Entity, Column, PrimaryColumn } from 'typeorm'

@Entity()
export class Posts {
  @PrimaryColumn({ type: 'text' })
  postId: string

  // Using COLLATE NOCASE for subreddit column so dont have to deal with case when doing a where clause.
  @Column({ collation: 'NOCASE', type: 'text' })
  subreddit: string

  @Column({ type: 'text' })
  author: string

  @Column({ type: 'text' })
  title: string

  @Column({ type: 'text', nullable: true, default: null })
  selftext: string

  @Column({ type: 'text', nullable: true, default: null })
  selftext_html: string

  @Column()
  score: number

  @Column({ default: false })
  is_reddit_media_domain: boolean

  @Column({ default: false })
  is_self: boolean

  @Column()
  created_utc: number

  @Column({ type: 'text' })
  domain: string

  @Column({ default: false })
  is_video: boolean

  @Column({ default: false })
  stickied: boolean

  @Column({ default: false })
  media_has_been_downloaded: boolean

  @Column({ default: 0 })
  mediaDownloadTries: number

  @Column({ type: 'text', nullable: true, default: null })
  post_hint: string

  @Column({ type: 'text' })
  permalink: string

  @Column({ type: 'text' })
  url: string

  @Column({ type: 'text', nullable: true, default: null })
  media: string

  @Column({ type: 'text', nullable: true, default: null })
  crosspost_parent: string
}
