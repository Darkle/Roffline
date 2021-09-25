import { Sequelize, DataTypes, Model } from 'sequelize'
import { noop } from '../../server/utils'

class AdminSettings extends Model {}

const tableSchema = {
  downloadComments: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  numberDownloadsAtOnce: {
    type: DataTypes.NUMBER,
    allowNull: false,
    defaultValue: 2,
  },
  downloadVideos: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  videoDownloadMaxFileSize: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '300',
  },
  videoDownloadResolution: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '480p',
  },
  updateAllDay: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  updateStartingHour: {
    type: DataTypes.NUMBER,
    allowNull: false,
    defaultValue: 1,
  },
  updateEndingHour: {
    type: DataTypes.NUMBER,
    allowNull: false,
    defaultValue: 5, // eslint-disable-line @typescript-eslint/no-magic-numbers
  },
}

const initAdminSettingsModel = (sequelize: Sequelize): Promise<void> => {
  AdminSettings.init(tableSchema, {
    sequelize,
    modelName: 'User',
    tableName: 'admin_settings',
  })
  return AdminSettings.sync().then(noop)
}

export { initAdminSettingsModel, AdminSettings }
