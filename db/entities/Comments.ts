import { Entity, PrimaryColumn, Column, BaseEntity } from 'typeorm'

@Entity()
export class Comments extends BaseEntity {
  @PrimaryColumn({ type: 'text' })
  postId: string

  @Column({ type: 'text' })
  comments: string
}
