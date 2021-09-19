import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity()
export class UpdatesTracker {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  lastUpdateDateAsString: string
}
