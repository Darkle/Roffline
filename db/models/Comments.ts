import { Entity, PrimaryColumn, Column } from 'typeorm'

@Entity()
export class Comments {
  @PrimaryColumn({ type: 'text' })
  postId: string

  @Column({ type: 'text' })
  comments: string
}
