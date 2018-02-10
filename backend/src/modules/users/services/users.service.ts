import { Component, Inject, HttpStatus, HttpException } from '@nestjs/common';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';

import { User } from './../interfaces/user.interface';
import { Credentials } from './../interfaces/credentials.interface';
import { UserEntity } from './../entities/user.entity';
import { UserRepositoryToken } from '../../constants';

type UpdateableInfo<T extends { [x: string]: any }, K extends string> = {
  [P in K]?: T[P];
};

@Component()
export class UsersService {

  constructor(
    @Inject(UserRepositoryToken)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  public async signUp(user: User): Promise<UserEntity> {
    return this.userRepository.save(Object.assign(
      new UserEntity(), // 1. create new Entity & hash password
      user, // 2. copy values from provided data
    ));
  }

  public async logIn(credentials: Credentials): Promise<UserEntity> {
    const user: UserEntity = await this.userRepository.findOne({ email: credentials.email});
    if (!user) {
      throw new HttpException('No such user.', HttpStatus.UNAUTHORIZED);
    }
    if (!user.isActive) {
      throw new HttpException('Inactive account.', HttpStatus.UNAUTHORIZED);
    }

    const isPasswordValid: boolean = await bcrypt.compare(credentials.password, user.password);
    if (!isPasswordValid) {
      throw new HttpException('Invalid credentials.', HttpStatus.UNAUTHORIZED);
    }

    return user;
  }

  public async updateUser(id: string | number, userProps: UpdateableInfo<User, keyof User> ): Promise<void> {
    const updates = Object.assign({}, userProps);
    // encrypt new password
    if (updates.password) {
      updates.password = await this.encrypt(updates.password);
    }
    await this.userRepository.updateById(id, updates);
  }

  public getUser(id: string | number): Promise<UserEntity> {
    return this.userRepository.findOneById(id);
  }

  private async encrypt(prop: string) {
    try {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(prop, salt);
      return hash;
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

}
