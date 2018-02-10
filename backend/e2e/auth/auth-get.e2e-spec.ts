import 'jest';
import * as request from 'supertest';
import * as express from 'express';
import * as faker from 'faker';
import * as bcrypt from 'bcryptjs';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Repository, Connection } from 'typeorm';

import { User } from '../../src/modules/users/interfaces/user.interface';
import { setUpConfig } from '../../src/config/configure';
import { configureApp } from '../../src/server';
import { AuthModule } from '../../src/modules/auth/auth.module';
import { DatabaseModule } from '../../src/modules/database/database.module';
import { UsersModule } from '../../src/modules/users/users.module';
import { UserEntity } from '../../src/modules/users/entities/user.entity';
import { UsersService } from '../../src/modules/users/services/users.service';

import { flushDb, populateDb } from '../seed/seed-gen';
import { DbContent } from '../seed/seed-interfaces';
import { MySQLConnectionToken } from '../../src/modules/constants';

// bigger timeout to populate db
jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000000;

describe('Users GET', () => {
  // server config
  const prefix = 'api';
  const server = express();
  const mockUsersNumber: number = 5;
  let app: INestApplication;

  // module config
  let userRepository: Repository<UserEntity>;
  let usersService: UsersService;
  let connection: Connection;
  // let redisClient: IRedisClientPromisifed;

   // dummy content
  let dbContent: DbContent;

  setUpConfig();

  beforeAll(async () => {
    setUpConfig();

    const module = await Test.createTestingModule({
      modules: [
        AuthModule,
        UsersModule,
      ],
    }).compile();

    app = await configureApp(
      module.createNestApplication(server),
    );
    app.init();

    const usersModule = module.select<UsersModule>(UsersModule);
    const dbModule = module.select<DatabaseModule>(DatabaseModule);
    usersService = usersModule.get<UsersService>(UsersService);
    connection = dbModule.get(MySQLConnectionToken);
    // hack to get easy access to private dependency for testing. Don't do it at home.
    // tslint:disable-next-line
    userRepository = usersService['userRepository'];

  });

  beforeEach(async () => {
    try {
      await flushDb(connection);
      dbContent = await populateDb(connection, {
        dbUsers: {
          numberOf: 1,
          activeUsers: [0],
        },
      });
    } catch (error) {
      console.log('DB ERROR', error);
    }
  });

  afterAll(async () => {
    try {
      await Promise.all([app.close(), flushDb(connection)]);
    } catch (error) {
      console.log('DB ERROR', error);
    }
  });

  describe('GET /token', () => {
    it('should return new access token', async () => {
      const { generatedUsers } = dbContent;
      const user = generatedUsers[0];
      const { body: loginBody } = await request(server)
        .post(`/${prefix}/users/login`)
        .send({ email: user.email, password: user.password })
        .expect(200);

      const { body: tokenBody } = await request(server)
        .get(`/${prefix}/auth/token/${loginBody.data.user.id}`)
        .set('x-refresh', loginBody.meta.refreshToken)
        .expect(200);

      expect(tokenBody.meta.accessToken).toBeDefined();
      expect(tokenBody.data).toBe('Ok');
      expect(typeof tokenBody.meta.accessToken).toBe('string');
    });
  });

});