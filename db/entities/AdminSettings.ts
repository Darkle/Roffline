import { Sequelize, DataTypes, Model } from 'sequelize'

type AdminSettings = {
  downloadComments: boolean
  numberDownloadsAtOnce: number
  downloadVideos: boolean
  videoDownloadMaxFileSize: string
  videoDownloadResolution: string
  updateAllDay: boolean
  updateStartingHour: number
  updateEndingHour: number
}

class AdminSettingsModel extends Model {}

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
    validate: { min: 1 },
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
    validate: { notEmpty: true },
  },
  videoDownloadResolution: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '480p',
    validate: { isIn: [['240p', '360p', '480p', '720p', '1080p', '1440p', '2160p']] },
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
    validate: { min: 1, max: 24 }, // eslint-disable-line @typescript-eslint/no-magic-numbers
  },
  updateEndingHour: {
    type: DataTypes.NUMBER,
    allowNull: false,
    defaultValue: 5, // eslint-disable-line @typescript-eslint/no-magic-numbers
    validate: { min: 1, max: 24 }, // eslint-disable-line @typescript-eslint/no-magic-numbers
  },
}

const initAdminSettingsModel = (sequelize: Sequelize): Promise<AdminSettingsModel> => {
  AdminSettingsModel.init(tableSchema, {
    sequelize,
    modelName: 'AdminSettingsModel',
    tableName: 'admin_settings',
    timestamps: false,
    defaultScope: {
      where: {
        id: 1,
      },
    },
  })
  return AdminSettingsModel.sync()
}

export { initAdminSettingsModel, AdminSettingsModel, AdminSettings }
