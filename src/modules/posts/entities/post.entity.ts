import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  AfterInsert,
  ManyToOne,
  OneToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  RelationCount,
} from 'typeorm';

import { UserEntity } from '../../users/entities/user.entity';
import { PostImageEntity } from './post-image.entity';
import { CommentEntity } from '../../comments/entities/comment.entity';

@Entity()
export class PostEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ type: 'text' })
  public content: string;

  // relations

  @ManyToOne(type => UserEntity, userEntity => userEntity.posts)
  public user: UserEntity;

  @OneToOne(type => PostImageEntity, postImageEntity => postImageEntity.post, {
    cascadeInsert: true,
    cascadeUpdate: true,
  })
  public image: PostImageEntity;

  @OneToMany(type => CommentEntity, commentEntity => commentEntity.post)
  public comments: CommentEntity[];

  @RelationCount((post: PostEntity) => post.comments)
  public commentsCount: number;

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