import { Component, Inject } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './../interfaces/user.interface';
import { UserEntity } from './../user.entity';
import { ValidationError } from 'class-validator';
import { UserRepositoryToken } from '../../constants';
import { ValidationException } from '../../common/exceptions/validation.exception';
import { AvailabilityService } from './availability.service';

@Component()
export class UsersService {

  constructor(
    @Inject(UserRepositoryToken)
    private readonly userRepository: Repository<UserEntity>,
    private readonly availabilityService: AvailabilityService,
  ) {}

  public getAll(): Promise<UserEntity[]> {
    return this.userRepository.find();
  }

  public async signUp(user: User): Promise<UserEntity> {
    await this.availabilityService.test(user, [
      { property: 'name', value: user.name },
      { property: 'email', value: user.email },
    ]);
    const newUser = Object.assign(new UserEntity(), user);
    console.log('newUser from service', newUser);
    const userRep = await this.userRepository.persist(newUser);
    console.log('userRepo newUser', userRep);
    return userRep;
  }

}