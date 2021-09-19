import { Entity, PrimaryColumn, Column } from 'typeorm'

/* eslint-disable functional/prefer-readonly-type */

@Entity()
export class Posts {
  @PrimaryColumn()
  id: string

  @Column()
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
