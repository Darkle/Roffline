import { Sequelize, DataTypes, Model } from 'sequelize'

class UserModel extends Model {
  get subreddits(): string[] {
    const subs = this.getDataValue('subreddits') as string[]
    // Capitalise each subreddit
    return subs.map(sub => sub.charAt(0).toUpperCase() + sub.slice(1))
  }

  set subreddits(subs: string[]) {
    this.setDataValue(
      'lastUpdateDateAsString',
      subs.map(sub => sub.toLowerCase())
    )
  }
}

type User = {
  name: string
  subreddits: string[]
  hideStickiedPosts: boolean
  onlyShowTitlesInFeed: boolean
  infiniteScroll: boolean
  darkModeTheme: boolean
}

const tableSchema = {
  name: {
    type: DataTypes.TEXT,
    allowNull: false,
    primaryKey: true,
  },
  subreddits: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
  },
  hideStickiedPosts: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  onlyShowTitlesInFeed: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  infiniteScroll: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  darkModeTheme: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}

const initUserModel = (sequelize: Sequelize): Promise<UserModel> => {
  UserModel.init(tableSchema, {
    sequelize,
    modelName: 'UserModel',
    tableName: 'users',
  })
  return UserModel.sync()
}

export { initUserModel, User, UserModel }
