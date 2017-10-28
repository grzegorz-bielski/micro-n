import * as request from 'supertest';
import * as express from 'express';
import * as faker from 'faker';
import { Test } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { User } from '../src/modules/users/interfaces/user.interface';
import { setUpConfig } from '../src/config/configure';
import { configureApp } from '../src/server';
import { AuthModule } from '../src/modules/auth/auth.module';
import { UsersModule } from '../src/modules/users/users.module';
import { UserEntity } from '../src/modules/users/entities/user.entity';
import { UsersService } from '../src/modules/users/services/users.service';
import { NotFoundException } from '../src/modules/common/exceptions/notFound.exception';

// bigger timeout to populate db
jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000000;

describe('Auth', () => {
  const prefix = 'api';
  const server = express();
  const mockUsersNumber: number = 2;
  const users: User[] = [];
  let dbUsers: UserEntity[] = [];
  let userRepository: Repository<UserEntity>;

  for (let i = 0; i < mockUsersNumber; i++) {
    let userData: User = {
      name: faker.name.firstName(),
      email: faker.internet.email(),
      password: faker.internet.password(),
    };

    // generate active user
    if (i === 0) {
      userData = Object.assign(userData, { isActive: true });
    }

    // generate one admin user
    if (i === 1) {
      userData = Object.assign(userData, {
        roles: JSON.stringify(['user', 'admin']),
        isActive: true,
      });
    }

    users.push(userData);
  }

  const flushDb = () => (
    userRepository
      .createQueryBuilder('user')
      .delete()
      .from(UserEntity)
      .execute()
  );

  const populateDb = () => (
    userRepository.save(users.map(user => Object.assign(new UserEntity(), user)))
  );

  beforeAll(async () => {
    setUpConfig();

    const appModule = await Test.createTestingModule({
      modules: [
        AuthModule,
        UsersModule,
      ],
    }).compile();

    await configureApp(appModule.createNestApplication(server)).init();

    const usersModule = appModule.select<UsersModule>(UsersModule);
    const usersService = usersModule.get<UsersService>(UsersService);
    // hack to get easy access to private dependency for testing. Don't do it at home.
    // tslint:disable-next-line
    userRepository = usersService['userRepository'];

    await flushDb();
    dbUsers = await populateDb();
  });

  afterAll(async () => {
    await flushDb();
  });

  describe('POST /token', () => {
    it('should return new access token', async () => {
      const user = users[0];
      const { body: loginBody } = await request(server)
        .post(`/${prefix}/users/login`)
        .send({ email: user.email, password: user.password })
        .expect(200);

      const { body: tokenBody } = await request(server)
        .post(`/${prefix}/auth/token`)
        .send({ id: loginBody.user.id, refreshToken: loginBody.refreshToken });

      expect(tokenBody.accessToken).toBeDefined();
      expect(typeof tokenBody.accessToken).toBe('string');
    });
  });
});