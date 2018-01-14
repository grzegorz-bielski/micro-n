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
import { MsgMetadataPartial } from '../../common/partial-entities/msg-metadata.partial-entity';

export class MsgAbstract {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ type: 'text', nullable: false })
  public content: string;

  @Column(type => MsgMetadataPartial)
  public meta: MsgMetadataPartial;
}