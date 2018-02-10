import {
  Column,
  Entity,
  PrimaryColumn,
  OneToOne,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { CommentEntity } from '../../comments/entities/comment.entity';
import { MsgVoteAbstract } from '../../common/abstract-entities/msg-vote.abstract-entity';
import { UserEntity } from '../../users/entities/user.entity';

@Entity()
export class CommentVoteEntity extends MsgVoteAbstract {

    @ManyToOne(type => UserEntity, userEntity => userEntity.commentVotes, { primary: true })
    public user: UserEntity;

    @OneToOne(type => CommentEntity, commentEntity => commentEntity.votes, { primary: true })
    @JoinColumn()
    public comment: CommentEntity;

}