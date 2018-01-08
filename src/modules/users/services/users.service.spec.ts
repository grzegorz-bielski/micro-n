import { Test } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { Repository } from 'typeorm';

import { User } from './../interfaces/user.interface';
import { UserEntity } from './../entities/user.entity';
import { DatabaseModule } from '../../database/database.module';
import { UsersService } from './users.service';
import { userProviders } from '../providers/users.providers';
import { setUpConfig } from '../../../config/configure';

describe('UsersService', () => {
  const flushDb = () => (
    userRepository
      .createQueryBuilder('user')
      .delete()
      .from(UserEntity)
      .execute()
  );
  const user: User = {
    name: 'kek0',
    email: 'kek@example0.com',
    password: 'kekeke0',
    description: 'special snowflake',
    isActive: true,
  };
  const user2: User = {
    name: 'kek4',
    email: 'kek4@example.com',
    password: 'kekeke',
    description: 'special snowflake',
  };
  let dbUser2: UserEntity;
  let dbUser: UserEntity;
  let usersService: UsersService;
  let userRepository: Repository<UserEntity>;

  setUpConfig();

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      modules: [
        DatabaseModule,
      ],
      components: [
        ...userProviders,
        UsersService,
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);

    // hack to get easy access to private dependency for testing. Don't do it at home.
    // tslint:disable-next-line
    userRepository = usersService['userRepository'];
  });

  afterAll(async () => {
    await flushDb();
  });

  beforeEach(async () => {
    await flushDb();

    // populate
    const dbUsers: UserEntity[] = await Promise.all([
      userRepository.save(Object.assign(new UserEntity(), user)),
      userRepository.save(Object.assign(new UserEntity(), user2)),
    ]);

    // assign
    dbUser = dbUsers[0];
    dbUser2 = dbUsers[1];
  });

  describe('signUp', () => {
    it('should create new user', async () => {
      const newUser: UserEntity = await usersService.signUp(
        Object.assign(user, { email: 'kek5@gmail.com', name: 'kek5' }),
      );

      expect(newUser).toBeDefined();
      expect(newUser).toBeInstanceOf(UserEntity);
    });
  });

  describe('logIn', () => {
    it('should throw HttpException if password is not valid', async () => {
      await expect(usersService.logIn({ email: user.email, password: 'test'}))
        .rejects.toBeInstanceOf(HttpException);
    });

    it('should throw HttpException if user is not active', async () => {
      await expect(usersService.logIn({ email: user2.email, password: user2.password}))
        .rejects.toBeInstanceOf(HttpException);
    });

    it('should log in user if credentials are valid and account is active', async () => {
      const loggedInUser: UserEntity = await usersService.logIn({ email: user.email, password: user.password});

      expect(loggedInUser).toBeDefined();
      expect(loggedInUser.name).toBe(user.name);
      expect(loggedInUser.email).toBe(user.email);
    });
  });

  describe('updateStatus', () => {
    it('should set given status to user', async () => {
      expect(dbUser2.isActive).toBe(false);
      await usersService.updateUser(dbUser2.id, { isActive: true });
      const postUpdateUser: UserEntity = await userRepository.findOne({ email: user2.email });
      expect(postUpdateUser.isActive).toBe(true);
    });
  });
});