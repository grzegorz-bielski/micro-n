import {
  Component,
  Inject,
  HttpStatus,
  HttpException,
  HttpCode,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';

export interface IVote {
  userId: number;
  msgId: number;
}

export interface IVoteConfig {
  Entity: any;
  type: string;
  userRepo: Repository<UserEntity>;
  msgRepo: Repository<object>;
  msgVoteRepo: Repository<object>;
}

@Component()
export class MsgVoteService {
  public async createVote({ msgId, userId }: IVote, repos: IVoteConfig): Promise<void> {
    const [user, msg] = await Promise.all([
      repos.userRepo.findOneById(userId),
      repos.msgRepo.findOneById(msgId),
    ]);

    if (!user) {
      throw new HttpException('There is no such user!', HttpStatus.NOT_FOUND);
    }

    if (!msg) {
      throw new HttpException(`There is no such ${repos.type}!`, HttpStatus.NOT_FOUND);
    }

    try {
      await repos.msgVoteRepo.insert(
        Object.assign(new repos.Entity(), { user, [repos.type]: msg },
      ));
    } catch ({ message }) {
      if (message.includes('ER_DUP_ENTRY')) {
        throw new HttpException('You can\'t vote twice', HttpStatus.FORBIDDEN);
      } else {
        throw new HttpException('DB Error', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }

  public async deleteVote({ msgId, userId }: IVote, repos: IVoteConfig): Promise<void> {
    const { affectedRows } = await repos.msgVoteRepo
      .createQueryBuilder('vote')
      .leftJoin(`vote.${repos.type}`, repos.type)
      .leftJoin('vote.user', 'user')
      .where(`${repos.type}.id = :msgId`, { msgId })
      .andWhere('user.id = :userId', { userId })
      .delete()
      .execute();

    if (affectedRows !== 1) {
      throw new HttpException('There is no vote to delete', HttpStatus.NOT_FOUND);
    }
  }

  public async deleteAllVotes(msgId: number, repos: IVoteConfig): Promise<void> {
    await repos.msgVoteRepo
      .createQueryBuilder('votes')
      .leftJoin(`votes.${repos.type}`, repos.type)
      .where(`${repos.type}.id = :msgId`, { msgId })
      .delete()
      .execute();
  }
}