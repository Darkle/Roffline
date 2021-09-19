import { Entity, PrimaryColumn, Column } from 'typeorm'

@Entity()
export class Users {
  @PrimaryColumn()
  name: string

  @Column()
  subreddits: string

  @Column()
  hideStickiedPosts: boolean

  @Column()
  onlyShowTitlesInFeed: boolean

  @Column()
  infiniteScroll: boolean

  @Column()
  darkModeTheme: boolean
}
