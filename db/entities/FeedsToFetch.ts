import { Sequelize, DataTypes, Model } from 'sequelize'

type FeedsToFetch = {
  feed: string
}

class FeedsToFetchModel extends Model {}

const tableSchema = {
  feed: {
    type: DataTypes.TEXT,
    allowNull: false,
    primaryKey: true,
    validate: { isUrl: true },
  },
}

const initFeedsToFetchModel = (sequelize: Sequelize): Promise<FeedsToFetchModel> => {
  FeedsToFetchModel.init(tableSchema, {
    sequelize,
    modelName: 'FeedsToFetchModel',
    tableName: 'feeds_to_fetch',
    timestamps: false,
  })
  return FeedsToFetchModel.sync()
}

export { initFeedsToFetchModel, FeedsToFetchModel, FeedsToFetch }
