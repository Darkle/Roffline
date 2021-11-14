import { Sequelize, DataTypes, Model } from 'sequelize'

type PostsToGet = {
  id: string
}

class PostsToGetModel extends Model {}

const tableSchema = {
  id: {
    type: DataTypes.TEXT,
    allowNull: false,
    primaryKey: true,
  },
}

const initPostsToGetModel = (sequelize: Sequelize): Promise<PostsToGetModel> => {
  PostsToGetModel.init(tableSchema, {
    sequelize,
    modelName: 'PostsToGetModel',
    tableName: 'posts_to_get',
    timestamps: false,
  })
  return PostsToGetModel.sync()
}

export { initPostsToGetModel, PostsToGetModel, PostsToGet }
