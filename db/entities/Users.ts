import { Sequelize, DataTypes, Model } from 'sequelize'

class UserModel extends Model {}

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
    validate: { notEmpty: true },
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
    timestamps: false,
    setterMethods: {
      subreddits(subs: string[]): void {
        this.setDataValue(
          'subreddits',
          subs.map(sub => sub.toLowerCase())
        )
      },
    },
  })
  return UserModel.sync()
}

export { initUserModel, User, UserModel }
