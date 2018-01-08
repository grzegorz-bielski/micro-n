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
import { setUpConfig } from '../../src/config/configure';
import { configureApp } from '../../src/server';
import { UsersModule } from '../../src/modules/users/users.module';
import { DatabaseModule } from '../../src/modules/database/database.module';
import { SignUpUserDto } from '../../src/modules/users/dto/sign-up.dto';
import { UserEntity } from '../../src/modules/users/entities/user.entity';
import { UsersService } from '../../src/modules/users/services/users.service';
import { VerificationService } from '../../src/modules/users/services/verification.service';
import { NotFoundException } from '../../src/modules/common/exceptions/notFound.exception';

// bigger timeout to populate db
// jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000000;

describe('Users POST', () => {
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

  setUpConfig();

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

  describe('/signup', () => {
    it('throws validation error if some required fields are missing', async () => {
      const signUpData = {
        name: 'kek2',
        email: 'kek2@example.com',
      };

      const response = await request(server)
        .post(`/${prefix}/users/signup`)
        .send(signUpData)
        .expect(400);

      expect(response.text).toBeDefined();

      const text = JSON.parse(response.text);
      expect(text.type).toBe('HttpException');
      expect(text.details.message).toBe('Request validation failed.');
    });

    it('throws validation error if email is invalid', async () => {
      const signUpData = {
        name: 'kek2',
        email: 'ke',
        password: '423423',
      };

      const response = await request(server)
        .post(`/${prefix}/users/signup`)
        .send(signUpData)
        .expect(400);

      expect(response.text).toBeDefined();

      const text = JSON.parse(response.text);
      expect(text.type).toBe('HttpException');
      expect(text.details.message).toBe('Request validation failed.');
    });

    it('creates new user', async () => {
      const signUpData: SignUpUserDto = {
        name: faker.name.firstName(),
        email: faker.internet.email(),
        password: faker.internet.password(),
      };
      await request(server)
        .post(`/${prefix}/users/signup`)
        .send(signUpData)
        .expect(201);

      const dbUser = await userRepository.findOne({ name: signUpData.name });

      expect(dbUser).toBeDefined();
      expect(dbUser.name).toBe(signUpData.name);
      expect(dbUser.email).toBe(signUpData.email);
      expect(typeof dbUser.password).toBe('string');
      expect(dbUser.description).toBeDefined();
      expect(dbUser.roles).toBeDefined();
    });
  });

  describe('/resetpassword', () => {
    it('should throw HttpException for invalid hash', async () => {
      const hash = '3kekt45tvtv4';
      const response = await request(server)
        .post(`/${prefix}/users/resetpassword`)
        .send({ hash, newPassword: '123' })
        .expect(400);
      const text = JSON.parse(response.text);

      expect(text.type).toBe('HttpException');
    });

    it('should reset password if hash is in DB', async () => {
      const { dbUsers } = dbContent;
      const newPassword = '123';
      // hack for testing
      // tslint:disable-next-line
      const hash = await verificationService['generateAndStoreHash'](dbUsers[0].id);

      const response = await request(server)
        .post(`/${prefix}/users/resetpassword`)
        .send({ hash, newPassword })
        .expect(200);

      const updatedUser = await userRepository.findOneById(dbUsers[0].id);
      const isTheSame = await bcrypt.compare(newPassword, updatedUser.password);

      expect(updatedUser.password).not.toBe(newPassword);
      expect(updatedUser.password).not.toBe(dbUsers[0].password);
      expect(isTheSame).toBe(true);
    });
  });

  describe('/login', () => {
    it('should successfully log in user', async () => {
      const { generatedUsers } = dbContent;
      const user = generatedUsers[0];

      const { body } = await request(server)
        .post(`/${prefix}/users/login`)
        .send({ email: user.email, password: user.password })
        .expect(200);

      expect(typeof body.meta.accessToken).toBe('string');
      expect(typeof body.meta.refreshToken).toBe('string');
      expect(body.data.user).toBeDefined();
      expect(body.data.user.name).toBe(user.name);
      expect(body.data.user.password).toBeUndefined();
    });

    it('should reject invalid credentials', async () => {
      const { generatedUsers } = dbContent;
      const user = generatedUsers[0];

      const { body } = await request(server)
        .post(`/${prefix}/users/login`)
        .send({ email: user.email, password: 'randompasss' })
        .expect(401);

      expect(body.type).toBe('HttpException');
    });

    it('should reject inactive user', async () => {
      const { generatedUsers } = dbContent;
      const user = generatedUsers[1];

      const { body } = await request(server)
        .post(`/${prefix}/users/login`)
        .send({ email: user.email, password: user.email })
        .expect(401);

      expect(body.type).toBe('HttpException');
    });
  });

});