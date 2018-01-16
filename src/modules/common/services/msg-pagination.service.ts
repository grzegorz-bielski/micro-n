import { Component, HttpException, HttpStatus } from '@nestjs/common';
import { Repository } from 'typeorm';
import { SelectQueryBuilder } from 'typeorm/query-builder/SelectQueryBuilder';
import { PostVoteEntity } from '../../posts/entities/post-vote.entity';
import { CommentVoteEntity } from '../../comments/entities/comment-vote.entity';

export interface MsgPaginationData {
  page: number;
  limit: number;
  newerThan: string;
  top: string;
  sort: string;
}

interface WhereClauses {
  condition: string;
  values: object;
}

export interface MsgPaginationConfig {
  repo: Repository<any>;
  type: string;
  relations?: string[];
  where?: WhereClauses[];
}

@Component()
export class MsgPaginationService {
  public async getMsgs(data: MsgPaginationData, config: MsgPaginationConfig) {
    const { page, limit, newerThan, top } = data;
    const { type } = config;
    const offset = (page - 1) * limit;
    const query = this.buildQuery(data, config);

    const [ msgs, count ] = await query
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    if (count <= 0 || msgs.length <= 0) {
      throw new HttpException(`There is no ${type}s`, HttpStatus.NOT_FOUND);
    }

    return { [`${type}s`]: msgs, count, pages: Math.ceil(count / limit) };

  }

  private buildQuery(data: MsgPaginationData, config: MsgPaginationConfig): SelectQueryBuilder<any> {
    return (
      this.getSorting(data, config,
        this.getConditions(data, config,
          this.getRelations(config),
        ),
      )
    );
  }

  private getRelations(config: MsgPaginationConfig): SelectQueryBuilder<any> {
    const { relations, type, repo } = config;
    let query = repo.createQueryBuilder(type);

    if (relations) {
      relations.forEach(relation => {
        query = query.leftJoinAndSelect(`${type}.${relation}`, relation);
      });
    }

    return query;
  }

  private getConditions(
    data: MsgPaginationData,
    config: MsgPaginationConfig,
    query: SelectQueryBuilder<any>,
  ): SelectQueryBuilder<any> {
    const { type, where } = config;

    if (where && where.length > 0) {
      where.forEach(({ condition, values }, index) => {
        query = index === 0 ? query.where(condition, values) : query.andWhere(condition, values);
      });
    }

    if (data.newerThan) {
      const condition = 'createdAt > :newerThan';
      const { newerThan } = data;

      query = (where && where.length) <= 0
        ? query.where(`${type}.${condition}`, { newerThan })
        : query.andWhere(`${type}.${condition}`, { newerThan });
    }

    return query;
  }

  private getSorting(
    data: MsgPaginationData,
    config: MsgPaginationConfig,
    query: SelectQueryBuilder<any>,
  ): SelectQueryBuilder<any> {
    const { type } = config;

    if (data.top) {
      // by votes
      const voteEntities =  {
        post: PostVoteEntity,
        comment: CommentVoteEntity,
      };
      query = query.addSelect(subQuery => (
        subQuery
          .select(`COUNT(votes.${type}Id)`)
          .from(voteEntities[type], 'votes')
          .where(`votes.${type}Id = ${type}.id`)
      ), 'total')
      .orderBy('total', 'DESC');
    } else if (data.sort) {
      // by creation date
      query =  query.orderBy(`${type}.createdAt`, 'DESC');
    }

    return query;
  }
}