import { Entity, PrimaryColumn, Column } from 'typeorm'

@Entity()
export class Posts {
  @PrimaryColumn()
  postId: string

  // Using COLLATE NOCASE for subreddit column so dont have to deal with case when doing a where clause.
  @Column({ collation: 'NOCASE' })
  subreddit: string

  @Column()
  author: string

  @Column()
  title: string

  @Column()
  selftext: string

  @Column()
  selftext_html: string

  @Column()
  score: number

  @Column()
  is_reddit_media_domain: boolean

  @Column()
  is_self: boolean

  @Column()
  created_utc: number

  @Column()
  domain: string

  @Column()
  is_video: boolean

  @Column()
  stickied: boolean

  @Column()
  media_has_been_downloaded: boolean

  @Column()
  mediaDownloadTries: number

  @Column()
  post_hint: string

  @Column()
  permalink: string

  @Column()
  url: string

  @Column()
  media: string

  @Column()
  comments: string

  @Column()
  crosspost_parent: string
}
