import { Sequelize, DataTypes, Model } from 'sequelize'
import { noop } from '../../server/utils'

class UpdatesTracker extends Model {}

const tableSchema = {
  lastUpdateDateAsString: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
}

const initUpdatesTrackerModel = (sequelize: Sequelize): Promise<void> => {
  UpdatesTracker.init(tableSchema, {
    sequelize,
    modelName: 'UpdatesTracker',
    tableName: 'updates_tracker',
  })
  return UpdatesTracker.sync().then(noop)
}

export { initUpdatesTrackerModel, UpdatesTracker }
