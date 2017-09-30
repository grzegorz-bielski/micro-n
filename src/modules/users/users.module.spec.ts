// Set up env variables based on Jest's globals -> jest.json
import '../../config/config';

import { Test } from '@nestjs/Testing';
import { User } from './interfaces/user.interface';
import { DatabaseModule } from '../database/database.module';
import { UsersController } from './users.controller';
import { UsersService } from './services/users.service';
import { AvailabilityService } from './services/availability.service';
import { userProviders } from './users.providers';

describe('UsersModule', () => {
  let usersController: UsersController;
  let usersService: UsersService;
  const users: User[] = [
    {
      name: 'kek',
      email: 'kek@gmail.com',
      password: 'keks',
      roles: ['user'],
      description: 'special snowflake',
    },
  ];

  beforeEach(async () => {
    const userModule = await Test.createTestingModule({
      modules: [DatabaseModule],
      controllers: [UsersController],
      components: [
        ...userProviders,
        AvailabilityService,
        UsersService,
      ],
    }).compile();

    usersService = userModule.get<UsersService>(UsersService);
    usersController = userModule.get<UsersController>(UsersController);
  });

  describe('/users GET - getAll', () => {
    it('should return an array of users', async () => {
      jest.spyOn(usersService, 'getAll').mockImplementation(() => users);

      expect(await usersController.getAll()).toBe(users);
    });
  });

  // describe('/signup POST - signUp', () => {
  //   it('should return a new user', async () => {
  //     jest.spyOn(usersService, 'signUp').mockImplementation(() => users[0]);

  //     expect(await usersController.signUp()).toBe(users[0]);
  //   });
  // });
});