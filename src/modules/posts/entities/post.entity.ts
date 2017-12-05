import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  AfterInsert,
  ManyToOne,
  OneToOne,
  OneToMany,
  ManyToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  RelationCount,
} from 'typeorm';

import { UserEntity } from '../../users/entities/user.entity';
import { TagEntity } from '../../tags/entities/tag.entity';
import { PostImageEntity } from './post-image.entity';
import { CommentEntity } from '../../comments/entities/comment.entity';
import { MsgMetadataPartial } from '../../common/partial-entities/msg-metadata.partial-entity';

@Entity()
export class PostEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ type: 'text', nullable: false })
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

  @ManyToMany(type => TagEntity, tagEntity => tagEntity.posts, { eager: true })
  public tags: TagEntity[];

  // embedded entities

  @Column(type => MsgMetadataPartial)
  public meta: MsgMetadataPartial;
}