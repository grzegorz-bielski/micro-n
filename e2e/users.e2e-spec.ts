import * as request from 'supertest';
import * as express from 'express';
import { Test } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { setUpConfig } from '../src/config/configure';
import { configureApp } from '../src/server';
import { UsersModule } from '../src/modules/users/users.module';
import { SignUpUserDto } from '../src/modules/users/dto/SignUpUser.dto';
import { UserEntity } from '../src/modules/users/entities/user.entity';
import { UsersService } from '../src/modules/users/services/users.service';

// jasmine.DEFAULT_TIMEOUT_INTERVAL = 100000;

describe('Users', () => {
  const prefix = 'api';
  const server = express();
  let userRepository: Repository<UserEntity>;

  const flush = (repository: Repository<UserEntity>) => (
    repository
      .createQueryBuilder('user')
      .delete()
      .from(UserEntity)
      .execute()
  );

  const populate = (repository: Repository<UserEntity>) => (
      repository
        .createQueryBuilder('user')
        .insert()
        .into(UserEntity)
        .values([
          // TODO
         ])
        .execute()
  );

  beforeAll(async () => {
    setUpConfig();
    const module = await Test.createTestingModule({
      modules: [
        UsersModule,
      ],
    }).compile();

    await configureApp(module.createNestApplication(server)).init();

    const usersModule = module.select<UsersModule>(UsersModule);
    const usersService = usersModule.get<UsersService>(UsersService);
    // hack to get easy access to private dependency for testing. Don't do it at home.
    // tslint:disable-next-line
    userRepository = usersService['userRepository'];
  });

  describe('POST /signup', () => {
    it('creates new user', async () => {
      // const signUpData: SignUpUserDto = {
      //   name: 'kek2',
      //   email: 'kek2com',
      //   password: 'cze',
      // };
      // const response = await request(server)
      //   .post(`/${prefix}/users/signup`)
      //   .send(signUpData)
      //   .expect(201);

      console.log(response.text);
    });
  });
});