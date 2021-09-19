import { Entity, PrimaryGeneratedColumn } from 'typeorm'

/* eslint-disable functional/prefer-readonly-type */

@Entity()
export class SubredditsMasterList {
  @PrimaryGeneratedColumn()
  subreddit: string
}
