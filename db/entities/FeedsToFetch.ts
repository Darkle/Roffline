import { Sequelize, DataTypes, Model } from 'sequelize'
import { noop } from '../../server/utils'

class FeedsToFetch extends Model {}

const tableSchema = {
  feed: {
    type: DataTypes.TEXT,
    allowNull: false,
    primaryKey: true,
  },
}

const initFeedsToFetchModel = (sequelize: Sequelize): Promise<void> => {
  FeedsToFetch.init(tableSchema, {
    sequelize,
    modelName: 'FeedsToFetch',
    tableName: 'feeds_to_fetch',
  })
  return FeedsToFetch.sync().then(noop)
}

export { initFeedsToFetchModel, FeedsToFetch }
