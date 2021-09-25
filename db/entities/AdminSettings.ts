import { DataTypes, Model } from 'sequelize'

class AdminSettings extends Model {}

const init = (sequelize): Promise => {
  AdminSettings.init(
    {
      id: {
        type: DataTypes.NUMBER,
        allowNull: false,
      },
      lastName: {
        type: DataTypes.STRING,
        // allowNull defaults to true
      },
    },
    {
      // Other model options go here
      sequelize, // We need to pass the connection instance
      modelName: 'User', // We need to choose the model name
      tableName: 'admin_settings',
    }
  )
  return AdminSettings.sync()
}

export { init }

// @Entity()
// export class AdminSettings {
//   id!: number // auto increment PK in SQL drivers

//   @Property({ default: true })
//   downloadComments!: boolean

//   @Property({ default: 2 })
//   numberDownloadsAtOnce!: number

//   @Property({ default: false })
//   downloadVideos!: boolean

//   @Property({ columnType: 'text', default: '300' })
//   videoDownloadMaxFileSize!: string

//   @Property({ columnType: 'text', default: '480p' })
//   videoDownloadResolution!: string

//   @Property({ default: true })
//   updateAllDay!: boolean

//   @Property({ default: 1 })
//   updateStartingHour!: number

//   @Property({ default: 5 }) // eslint-disable-line @typescript-eslint/no-magic-numbers
//   updateEndingHour!: number
// }
