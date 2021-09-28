import { Sequelize, DataTypes, Model } from 'sequelize'

type UpdatesTrackerType = {
  lastUpdateDateAsString: string
}

class UpdatesTracker extends Model {}

const tableSchema = {
  lastUpdateDateAsString: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
}

const initUpdatesTrackerModel = (sequelize: Sequelize): Promise<UpdatesTracker> => {
  UpdatesTracker.init(tableSchema, {
    sequelize,
    modelName: 'UpdatesTracker',
    tableName: 'updates_tracker',
  })
  return UpdatesTracker.sync()
}

export { initUpdatesTrackerModel, UpdatesTracker, UpdatesTrackerType }
