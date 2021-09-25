import { PrimaryKey, Property, Entity } from '@mikro-orm/core'

type UserType = {
  name: string
  subreddits: string
  hideStickiedPosts: boolean
  onlyShowTitlesInFeed: boolean
  infiniteScroll: boolean
  darkModeTheme: boolean
}

@Entity({ tableName: 'users' })
export class User {
  @PrimaryKey({ columnType: 'text' })
  name!: string

  @Property({ columnType: 'text', default: '' })
  subreddits!: string

  @Property({ default: true })
  hideStickiedPosts!: boolean

  @Property({ default: false })
  onlyShowTitlesInFeed!: boolean

  @Property({ default: false })
  infiniteScroll!: boolean

  @Property({ default: false })
  darkModeTheme!: boolean
}

export { UserType }
