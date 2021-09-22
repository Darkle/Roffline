import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from 'typeorm'

@Entity()
export class AdminSettings extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ default: true })
  downloadComments: boolean

  @Column({ default: 2 })
  numberDownloadsAtOnce: number

  @Column({ default: false })
  downloadVideos: boolean

  @Column({ type: 'text', default: '300' })
  videoDownloadMaxFileSize: string

  @Column({ type: 'text', default: '480p' })
  videoDownloadResolution: string

  @Column({ default: true })
  updateAllDay: boolean

  @Column({ default: 1 })
  updateStartingHour: number

  @Column({ default: 5 }) // eslint-disable-line @typescript-eslint/no-magic-numbers
  updateEndingHour: number
}
