import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MsgImageAbstract } from '../../common/abstract-entities/msg-image.abstract-entity';
import { PostEntity } from './post.entity';

@Entity()
export class PostImageEntity extends MsgImageAbstract {

  @OneToOne(type => PostEntity, postEntity => postEntity.image)
  @JoinColumn()
  public post: PostEntity;

}