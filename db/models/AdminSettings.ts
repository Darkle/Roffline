import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

/* eslint-disable functional/prefer-readonly-type */

@Entity()
export class AdminSettings {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  downloadComments: boolean

  @Column()
  numberDownloadsAtOnce: number

  @Column()
  downloadVideos: boolean

  @Column()
  videoDownloadMaxFileSize: string

  @Column()
  videoDownloadResolution: string

  @Column()
  updateAllDay: boolean

  @Column()
  updateStartingHour: number

  @Column()
  updateEndingHour: number

  @Column()
  firstRun: boolean
}
