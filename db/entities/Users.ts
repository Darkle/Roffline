import { Sequelize, DataTypes, Model } from 'sequelize'
import { noop } from '../../server/utils'

class User extends Model {}

type UserType = {
  name: string
  subreddits: string
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

const initUserModel = (sequelize: Sequelize): Promise<void> => {
  User.init(tableSchema, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
  })
  return User.sync().then(noop)
}

export { initUserModel, UserType, User }