import { Sequelize, DataTypes, Model } from 'sequelize'

type UpdatesTracker = {
  lastUpdateDateAsString: string
}

class UpdatesTrackerModel extends Model {
  get lastUpdateDateAsString(): string {
    return this.getDataValue('lastUpdateDateAsString') as string
  }

  set lastUpdateDateAsString(date: string | Date) {
    this.setDataValue('lastUpdateDateAsString', date.toString())
  }
}

const tableSchema = {
  lastUpdateDateAsString: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
}

const initUpdatesTrackerModel = (sequelize: Sequelize): Promise<UpdatesTrackerModel> => {
  UpdatesTrackerModel.init(tableSchema, {
    sequelize,
    modelName: 'UpdatesTrackerModel',
    tableName: 'updates_tracker',
  })
  return UpdatesTrackerModel.sync()
}

export { initUpdatesTrackerModel, UpdatesTrackerModel, UpdatesTracker }
