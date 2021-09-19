import { Entity, PrimaryColumn, Column } from 'typeorm'

@Entity()
export class Comments {
  @PrimaryColumn()
  postId: string

  @Column()
  comments: string
}
