import { Entity, PrimaryColumn, Column } from 'typeorm'

@Entity()
export class Users {
  @PrimaryColumn({ type: 'text' })
  name: string

  @Column({ type: 'simple-array', default: '' })
  subreddits: string[]

  @Column({ default: true })
  hideStickiedPosts: boolean

  @Column({ default: false })
  onlyShowTitlesInFeed: boolean

  @Column({ default: false })
  infiniteScroll: boolean

  @Column({ default: false })
  darkModeTheme: boolean
}
