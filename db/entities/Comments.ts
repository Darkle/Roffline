import { Sequelize, DataTypes, Model } from 'sequelize'

type Comments = {
  postId: string
  comments: string
}

class CommentsModel extends Model {}

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

const initCommentsModel = (sequelize: Sequelize): Promise<CommentsModel> => {
  CommentsModel.init(tableSchema, {
    sequelize,
    modelName: 'CommentsModel',
    tableName: 'comments',
  })
  return CommentsModel.sync()
}

export { initCommentsModel, CommentsModel, Comments }
