import {
  PrimaryColumn,
  CreateDateColumn,
  OneToOne,
} from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';

export abstract class MsgVoteAbstract {

    @CreateDateColumn()
    public createdAt: string;
}