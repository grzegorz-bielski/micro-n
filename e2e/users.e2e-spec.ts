import * as request from 'supertest';
import * as express from 'express';
import * as faker from 'faker';
import * as crypto from 'crypto';
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

// bigger timeout to populate db
jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000000;

describe('Users', () => {
  const prefix = 'api';
  const server = express();
  const users: UserEntity[] = [];
  const mockUsersNumber: number = 5;
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

    users.push(
      Object.assign(new UserEntity(), userData),
    );
  }

  const flushDb = () => (
    userRepository
      .createQueryBuilder('user')
      .delete()
      .from(UserEntity)
      .execute()
  );

  const populateDb = () => (
    userRepository.save(users)
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
    await populateDb();
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
    it('should successfully log in user', () => {
      //
    });
  });

  describe('DELETE /logout', () => {
    it('should successfully log out user', () => {
      //
    });
  });
});