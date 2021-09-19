import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

/* eslint-disable functional/prefer-readonly-type */

@Entity()
export class UpdatesTracker {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  lastUpdateDateAsString: string
}
