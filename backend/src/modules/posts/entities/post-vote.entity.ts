import {
  Column,
  Entity,
  PrimaryColumn,
  OneToOne,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { PostEntity } from '../../posts/entities/post.entity';
import { MsgVoteAbstract } from '../../common/abstract-entities/msg-vote.abstract-entity';
import { UserEntity } from '../../users/entities/user.entity';

@Entity()
export class PostVoteEntity extends MsgVoteAbstract {

    @ManyToOne(type => UserEntity, userEntity => userEntity.postVotes, { primary: true })
    public user: UserEntity;

    @OneToOne(type => PostEntity, postEntity => postEntity.votes, { primary: true })
    @JoinColumn()
    public post: PostEntity;

}