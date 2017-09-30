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

    // const access = 'auth';
    // const token = jwt.sign(
    //     {_id: user._id.toHexString(), access}, 
    //     process.env.JWT_SECRET
    // ).toString();
    // user.tokens.push({access, token});

    return this.userRepository.persist(newUser);
  }

}