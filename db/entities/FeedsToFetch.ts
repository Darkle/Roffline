import { Sequelize, DataTypes, Model } from 'sequelize'

type FeedsToFetchType = {
  feed: string
}

class FeedsToFetch extends Model {}

const tableSchema = {
  feed: {
    type: DataTypes.TEXT,
    allowNull: false,
    primaryKey: true,
  },
}

const initFeedsToFetchModel = (sequelize: Sequelize): Promise<FeedsToFetch> => {
  FeedsToFetch.init(tableSchema, {
    sequelize,
    modelName: 'FeedsToFetch',
    tableName: 'feeds_to_fetch',
  })
  return FeedsToFetch.sync()
}

export { initFeedsToFetchModel, FeedsToFetch, FeedsToFetchType }
