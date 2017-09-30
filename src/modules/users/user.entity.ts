import { Entity, Column, PrimaryGeneratedColumn, BeforeInsert, AfterInsert } from 'typeorm';
import { HttpException } from '@nestjs/core';
import { HttpStatus } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

const defaultRole = JSON.stringify(['user']);

@Entity()
export class UserEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({
    unique: true,
    length: 100,
  })
  public name: string;

  @Column({
    unique: true,
    length: 100,
  })
  public email: string;

  @Column({ length: 100 })
  public password: string;

  @Column({ length: 500 })
  public description: string;

  @Column({
    default: defaultRole,
  })
  public roles: string;

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

  // if no roles are provided then return default one
  @AfterInsert()
  public addDefault() {
    if (!this.roles) {
      this.roles = defaultRole;
    }
  }
}
