import { Component, Inject } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './../interfaces/user.interface';
import { UserEntity } from './../user.entity';
import { UserRepositoryToken } from '../../constants';

@Component()
export class UsersService {

  constructor(
    @Inject(UserRepositoryToken)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  public getAll(): Promise<UserEntity[]> {
    return this.userRepository.find();
  }

  public signUp(user: User): Promise<UserEntity> {
    const newUser = Object.assign(new UserEntity(), user);
    return this.userRepository.persist(newUser);

    // console.log('newUser from service', newUser);
    // console.log('userRepo newUser', userRep);
    // return userRep;
  }

  public updateStatus(id: string, status: boolean) {
    return this.userRepository.updateById(id, { isActive: status } );
  }

}
