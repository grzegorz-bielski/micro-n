import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BeforeInsert,
  AfterInsert,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { HttpException } from '@nestjs/core';
import { HttpStatus } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

import { PostEntity } from '../../posts/entities/post.entity';

const defaultRole = JSON.stringify(['user']);
const defaultDescription = 'Write something about yourself.';

@Entity()
export class UserEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ unique: true, length: 100 })
  public name: string;

  @Column({ unique: true, length: 100 })
  public email: string;

  @Column({ length: 100 })
  public password: string;

  @OneToMany(type => PostEntity, postEntity => postEntity.user, { eager: true })
  public posts: PostEntity[];

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
