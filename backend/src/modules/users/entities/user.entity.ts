import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BeforeInsert,
  RelationCount,
  AfterInsert,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { HttpException } from '@nestjs/core';
import { HttpStatus } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

import { PostEntity } from '../../posts/entities/post.entity';
import { CommentEntity } from '../../comments/entities/comment.entity';
import { CommentVoteEntity } from '../../comments/entities/comment-vote.entity';
import { PostVoteEntity } from '../../posts/entities/post-vote.entity';

const defaultRole = JSON.stringify(['user']);
const defaultDescription = 'Write something about yourself.';

@Entity()
export class UserEntity {

  // general info

  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ unique: true, length: 100 })
  public name: string;

  @Column({ unique: true, length: 100 })
  public email: string;

  @Column({ length: 100 })
  public password: string;

  // posts

  @OneToMany(type => PostEntity, postEntity => postEntity.user)
  public posts: PostEntity[];

  @RelationCount((user: UserEntity) => user.posts)
  public postsCount: number;

  @OneToMany(type => PostVoteEntity, postVoteEntity => postVoteEntity.user)
  public postVotes: PostVoteEntity;

  @RelationCount((user: UserEntity) => user.postVotes)
  public postVotesCount: number;

  // comments

  @OneToMany(type => CommentEntity, commentEntity => commentEntity.user)
  public comments: CommentEntity[];

  @RelationCount((user: UserEntity) => user.comments)
  public commentsCount: number;

  @OneToMany(type => CommentVoteEntity, commentVoteEntity => commentVoteEntity.user)
  public commentVotes: CommentVoteEntity[];

  @RelationCount((user: UserEntity) => user.commentVotes)
  public commentsVotesCount: number;

  // metadata

  @CreateDateColumn()
  public createdAt: string;

  @UpdateDateColumn()
  public updatedAt: string;

  @Column({ length: 500, default: defaultDescription })
  public description: string;

  @Column({ default: defaultRole })
  public roles: string;

  @Column({ default: false })
  public isActive: boolean;

  // event listeners

  // hash password before putting to the DB
  @BeforeInsert()
  public async encrypt() {
    try {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(this.password, salt);
      this.password = hash;
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // return default values to the service
  // TODO: make it more sane
  @AfterInsert()
  public addDefault() {
    if (!this.roles) {
      this.roles = defaultRole;
    }

    if (!this.description) {
      this.description = defaultDescription;
    }

    if (!this.isActive) {
      this.isActive = false;
    }
  }
}
