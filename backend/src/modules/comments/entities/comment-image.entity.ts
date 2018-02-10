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
import { CommentEntity } from './comment.entity';

@Entity()
export class CommentImageEntity extends MsgImageAbstract {

  @OneToOne(type => CommentEntity, commentEntity => commentEntity.image, { eager: true })
  @JoinColumn()
  public post: CommentEntity;

}