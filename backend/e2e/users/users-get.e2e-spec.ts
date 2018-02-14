import 'jest';
import * as request from 'supertest';
import * as express from 'express';
import * as faker from 'faker';
import * as bcrypt from 'bcryptjs';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Repository, Connection } from 'typeorm';

import { flushDb, populateDb } from '../seed/seed-gen';
import { DbContent } from '../seed/seed-interfaces';
import { MySQLConnectionToken } from '../../src/modules/constants';
import { User } from '../../src/modules/users/interfaces/user.interface';
import { configureApp } from '../../src/server';
import { UsersModule } from '../../src/modules/users/users.module';
import { DatabaseModule } from '../../src/modules/database/database.module';
import { SignUpUserDto } from '../../src/modules/users/dto/sign-up.dto';
import { UserEntity } from '../../src/modules/users/entities/user.entity';
import { UsersService } from '../../src/modules/users/services/users.service';
import { VerificationService } from '../../src/modules/users/services/verification.service';
import { NotFoundException } from '../../src/modules/common/exceptions/notFound.exception';

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
  let verificationService: VerificationService;
  let connection: Connection;
  // let redisClient: IRedisClientPromisifed;

   // dummy content
  let dbContent: DbContent;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      modules: [
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
    verificationService = usersModule.get<VerificationService>(VerificationService);
    connection = dbModule.get(MySQLConnectionToken);
    // hack to get easy access to private dependency for testing. Don't do it at home.
    // tslint:disable-next-line
    userRepository = usersService['userRepository'];
    // tslint:disable-next-line
    // redisClient = verificationService['redisClient'];

  });

  beforeEach(async () => {
    try {
      await flushDb(connection);
      dbContent = await populateDb(connection, {
        dbUsers: {
          numberOf: 3,
          activeUsers: [0, 1],
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

  describe('/users/verify', () => {
    it('should throw HttpException for invalid hash', async () => {
      const hash = '3kekt45tvtv4';
      const response = await request(server)
        .get(`/${prefix}/users/verify?hash=${hash}`)
        .expect(400);
      const text = JSON.parse(response.text);

      expect(text.type).toBe('HttpException');
    });

    it('should verify user if hash is valid', async () => {
      const signUpData: SignUpUserDto = {
        name: faker.name.firstName(),
        email: faker.internet.email(),
        password: faker.internet.password(),
      };
      const signUResponse = await request(server)
        .post(`/${prefix}/users/signup`)
        .send(signUpData)
        .expect(201);
      const dbUserBefore = await userRepository.findOne({ name: signUpData.name });
      const verifyResponse = await request(server)
        .get(`/${prefix}/users/verify?hash=${JSON.parse(signUResponse.text).hash}`)
        .expect(200);
      const dbUserAfter = await userRepository.findOne({ name: signUpData.name });

      expect(verifyResponse.text).toBeDefined();
      expect(dbUserBefore.isActive).toBe(false);
      expect(dbUserAfter.isActive).toBe(true);
    });
  });

  describe('/:id/resetpassword', () => {
    it('should throw HttpException if user is not found', async () => {
      await request(server)
        .get(`/${prefix}/users/4574745645645645/resetpassword`)
        .expect(404);
    });

    it('should send reset password request', async () => {
      const { dbUsers } = dbContent;
      await request(server)
        .get(`/${prefix}/users/${dbUsers[0].id}/resetpassword`)
        .expect(200);
    });
  });

});