import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  AfterInsert,
  ManyToOne,
  ManyToMany,
  OneToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { UserEntity } from '../../users/entities/user.entity';
import { TagEntity } from '../../tags/entities/tag.entity';
import { PostEntity } from '../../posts/entities/post.entity';
import { CommentImageEntity } from './comment-image.entity';
import { MsgMetadataPartial } from '../../common/partial-entities/msg-metadata.partial-entity';

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

  @ManyToMany(type => TagEntity, tagEntity => tagEntity.comments, { eager: true })
  public tags: TagEntity[];

  // embedded entities

  @Column(type => MsgMetadataPartial)
  public meta: MsgMetadataPartial;
}