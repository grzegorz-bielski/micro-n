import {
  Entity,
  Column,
  ManyToOne,
  OneToOne,
  OneToMany,
  ManyToMany,
  RelationCount,
} from 'typeorm';

import { PostEntity } from '../../posts/entities/post.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { TagEntity } from '../../tags/entities/tag.entity';
import { CommentImageEntity } from './comment-image.entity';
import { CommentVoteEntity } from './comment-vote.entity';
import { MsgAbstract } from '../../common/abstract-entities/msg.abstract-entity';

@Entity()
export class CommentEntity extends MsgAbstract {

  // user

  @ManyToOne(type => UserEntity, userEntity => userEntity.posts)
  public user: UserEntity;

  // post

  @ManyToOne(type => PostEntity, postEntity => postEntity.comments)
  public post: PostEntity;

  // image

  @OneToOne(type => CommentImageEntity, commentImageEntity => commentImageEntity.post, {
    cascadeInsert: true,
    cascadeUpdate: true,
  })
  public image: CommentImageEntity;

  // votes

  @OneToMany(type => CommentVoteEntity, commentVoteEntity => commentVoteEntity.comment)
  public votes: CommentVoteEntity[];

  @RelationCount((post: PostEntity) => post.votes)
  public votesCount: number;

  // tags

  @ManyToMany(type => TagEntity, tagEntity => tagEntity.comments, { eager: true })
  public tags: TagEntity[];

}