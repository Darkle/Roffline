import { Sequelize, DataTypes, Model } from 'sequelize'

type CommentsType = {
  postId: string
  comments: string
}

class Comments extends Model {}

const tableSchema = {
  postId: {
    type: DataTypes.TEXT,
    allowNull: false,
    primaryKey: true,
  },
  comments: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
}

const initCommentsModel = (sequelize: Sequelize): Promise<Comments> => {
  Comments.init(tableSchema, {
    sequelize, // We need to pass the connection instance
    modelName: 'Comments', // We need to choose the model name
    tableName: 'comments',
  })
  return Comments.sync()
}

export { initCommentsModel, Comments, CommentsType }
