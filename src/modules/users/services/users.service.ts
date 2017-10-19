import { Component, Inject, HttpStatus } from '@nestjs/common';
import { HttpException } from '@nestjs/core';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';

import { User } from './../interfaces/user.interface';
import { Credentials } from './../interfaces/credentials.interface';
import { UserEntity } from './../entities/user.entity';
import { UserRepositoryToken } from '../../constants';

@Component()
export class UsersService {

  constructor(
    @Inject(UserRepositoryToken)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  // public getAll(): Promise<UserEntity[]> {
  //   return this.userRepository.find();
  // }

  public signUp(user: User): Promise<UserEntity> {
    const newUser: UserEntity & User = Object.assign(new UserEntity(), user);
    return this.userRepository.save(newUser);
  }

  public async logIn(credentials: Credentials): Promise<UserEntity> {
    const user: UserEntity = await this.userRepository.findOne({ email: credentials.email});
    if (!user) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }
    if (!user.isActive) {
      throw new HttpException('Inactive account', HttpStatus.UNAUTHORIZED);
    }

    const isPasswordValid: boolean = await bcrypt.compare(credentials.password, user.password);
    if (!isPasswordValid) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    return user;
  }

  public updateStatus(id: string | number, status: boolean): Promise<void> {
    return this.userRepository.updateById(id, { isActive: status } );
  }

}
