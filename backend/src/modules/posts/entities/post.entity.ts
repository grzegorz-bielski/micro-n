import {
  Entity,
  Column,
  OneToOne,
  OneToMany,
  ManyToOne,
  ManyToMany,
  RelationCount,
} from 'typeorm';

import { PostImageEntity } from './post-image.entity';
import { PostVoteEntity } from './post-vote.entity';
import { UserEntity } from './../../users/entities/user.entity';
import { TagEntity } from './../../tags/entities/tag.entity';
import { CommentEntity } from '../../comments/entities/comment.entity';
import { MsgAbstract } from '../../common/abstract-entities/msg.abstract-entity';

@Entity()
export class PostEntity extends MsgAbstract {

  // user

  @ManyToOne(type => UserEntity, userEntity => userEntity.posts)
  public user: UserEntity;

  // image

  @OneToOne(type => PostImageEntity, postImageEntity => postImageEntity.post, {
    cascadeInsert: true,
    cascadeUpdate: true,
  })
  public image: PostImageEntity;

  // comments

  @OneToMany(type => CommentEntity, commentEntity => commentEntity.post)
  public comments: CommentEntity[];

  @RelationCount((post: PostEntity) => post.comments)
  public commentsCount: number;

  // votes

  @OneToMany(type => PostVoteEntity, postVoteEntity => postVoteEntity.post)
  public votes: PostVoteEntity[];

  @RelationCount((post: PostEntity) => post.votes)
  public votesCount: number;

  // tags

  @ManyToMany(type => TagEntity, tagEntity => tagEntity.posts, { eager: true })
  public tags: TagEntity[];

}