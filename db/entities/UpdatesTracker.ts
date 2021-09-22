import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from 'typeorm'

@Entity()
export class UpdatesTracker extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'text' })
  lastUpdateDateAsString: string
}
