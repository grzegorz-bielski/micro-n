import * as request from 'supertest';
import * as express from 'express';
import * as faker from 'faker';
import { Test } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { User } from '../src/modules/users/interfaces/user.interface';
import { setUpConfig } from '../src/config/configure';
import { configureApp } from '../src/server';
import { UsersModule } from '../src/modules/users/users.module';
import { SignUpUserDto } from '../src/modules/users/dto/SignUpUser.dto';
import { UserEntity } from '../src/modules/users/entities/user.entity';
import { UsersService } from '../src/modules/users/services/users.service';
import { VerificationService } from '../src/modules/users/services/verification.service';
import { NotFoundException } from '../src/modules/common/exceptions/notFound.exception';

// bigger timeout to populate db
jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000000;

describe('Users', () => {
  const prefix = 'api';
  const server = express();
  const mockUsersNumber: number = 5;
  const users: User[] = [];
  let dbUsers: UserEntity[] = [];
  let userRepository: Repository<UserEntity>;
  let usersService: UsersService;
  let verificationService: VerificationService;

  for (let i = 0; i < mockUsersNumber; i++) {
    let userData: User = {
      name: faker.name.firstName(),
      email: faker.internet.email(),
      password: faker.internet.password(),
    };

    // generate one active user
    if (i === 0) {
      userData = Object.assign(userData, { isActive: true });
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

    const module = await Test.createTestingModule({
      modules: [
        UsersModule,
      ],
    }).compile();

    await configureApp(module.createNestApplication(server)).init();

    const usersModule = module.select<UsersModule>(UsersModule);
    usersService = usersModule.get<UsersService>(UsersService);
    verificationService = usersModule.get<VerificationService>(VerificationService);
    // hack to get easy access to private dependency for testing. Don't do it at home.
    // tslint:disable-next-line
    userRepository = usersService['userRepository'];

    await flushDb();
    dbUsers = await populateDb();
  });

  afterAll(async () => {
    await flushDb();
  });

  describe('POST /signup', () => {
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

      // console.log(response.text);

      const dbUser = await userRepository.findOne({ name: signUpData.name });

      expect(dbUser).toBeDefined();
      expect(dbUser.name).toBe(signUpData.name);
      expect(dbUser.email).toBe(signUpData.email);
      expect(typeof dbUser.password).toBe('string');
      expect(dbUser.description).toBeDefined();
      expect(dbUser.roles).toBeDefined();
    });
  });

  describe('GET /users/verify', () => {
    it('should HttpException for invalid hash', async () => {
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

  describe('POST /login', () => {
    it('should successfully log in user', async () => {
      const user = users[0];

      const { body } = await request(server)
        .post(`/${prefix}/users/login`)
        .send({ email: user.email, password: user.password })
        .expect(200);

      expect(typeof body.accessToken).toBe('string');
      expect(typeof body.refreshToken).toBe('string');
      expect(body.user).toBeDefined();
      expect(body.user.name).toBe(user.name);
      expect(body.user).toEqual(body.user);
    });

    it('should reject invalid credentials', async () => {
      const user = users[0];

      const { body } = await request(server)
        .post(`/${prefix}/users/login`)
        .send({ email: user.email, password: 'randompasss' })
        .expect(401);

      expect(body.type).toBe('HttpException');
    });

    it('should reject inactive user', async () => {
      const user = users[1];

      const { body } = await request(server)
        .post(`/${prefix}/users/login`)
        .send({ email: user.email, password: user.email })
        .expect(401);

      expect(body.type).toBe('HttpException');
    });
  });

  describe('DELETE /logout', () => {
    it('should successfully log out user', async () => {
      const user = users[0];

      const { body } = await request(server)
        .post(`/${prefix}/users/login`)
        .send({ email: user.email, password: user.password })
        .expect(200);

      await request(server)
        .delete(`/${prefix}/users/logout`)
        .set('x-refresh', body.refreshToken)
        .set('x-auth', body.accessToken)
        .expect(200);
    });
  });

  describe('DELETE /logoutall', () => {
    it('should successfully log out user from all sessions', async () => {
      const user = users[0];

      const { body } = await request(server)
        .post(`/${prefix}/users/login`)
        .send({ email: user.email, password: user.password })
        .expect(200);

      await request(server)
        .post(`/${prefix}/users/login`)
        .send({ email: user.email, password: user.password })
        .expect(200);

      await request(server)
        .delete(`/${prefix}/users/logoutall`)
        .set('x-refresh', body.refreshToken)
        .set('x-auth', body.accessToken)
        .expect(200);

    });
  });

  describe('ALL /*', () => {
    it('should throw NotFoundException', async () => {
      const response = await request(server)
        .get(`/${prefix}/users/fefwekfwefwe`);

      const text = JSON.parse(response.text);
      expect(text.type).toBe('HttpException');
    });
  });
});