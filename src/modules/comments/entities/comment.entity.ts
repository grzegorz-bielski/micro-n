import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  AfterInsert,
  ManyToOne,
  OneToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { UserEntity } from '../../users/entities/user.entity';
import { PostEntity } from '../../posts/entities/post.entity';
import { CommentImageEntity } from './comment-image.entity';

@Entity()
export class CommentEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ type: 'text', nullable: false })
  public content: string;

  // relations

  @ManyToOne(type => PostEntity, postEntity => postEntity.comments)
  public post: PostEntity;

  @ManyToOne(type => UserEntity, userEntity => userEntity.posts)
  public user: UserEntity;

  @OneToOne(type => CommentImageEntity, commentImageEntity => commentImageEntity.post, {
    cascadeInsert: true,
    cascadeUpdate: true,
  })
  public image: CommentImageEntity;

  // metadata

  @Column({ type: 'int', default: 0 })
  public score: number;

  @CreateDateColumn()
  public createdAt: string;

  @UpdateDateColumn()
  public updatedAt: string;

  // event listeners

  @AfterInsert()
  public addDefault() {
    if (!this.score) {
      this.score = 0;
    }
  }

}