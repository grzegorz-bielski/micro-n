import 'jest';
import { Test } from '@nestjs/testing';

import { setUpConfig } from '../../../config/configure';
import { User } from './../interfaces/user.interface';
import { Repository } from 'typeorm';
import { UserEntity } from './../entities/user.entity';
import { DatabaseModule } from '../../database/database.module';
import { userProviders } from './../providers/users.providers';
import { AvailabilityService } from '../services/availability.service';
import { ValidationException } from '../../common/exceptions/validation.exception';

describe('AvailabilityService', () => {
  const flushDb = () => (
    userRepository
      .createQueryBuilder('user')
      .delete()
      .from(UserEntity)
      .execute()
  );
  const user: User = {
    name: 'kek',
    email: 'kek@example.com',
    password: 'kekeke',
    description: 'special snowflake',
  };
  let dbUser: UserEntity;
  let availabilityService: AvailabilityService;
  let userRepository: Repository<UserEntity>;

  setUpConfig();

  beforeAll(async () => {
    const module = await Test.createTestingModule({
        modules: [
          DatabaseModule,
      ],
      components: [
          ...userProviders,
          AvailabilityService,
      ],
      }).compile();

    availabilityService = module.get<AvailabilityService>(AvailabilityService);

    // hack to get easy access to private dependency for testing. Don't do it at home.
    // tslint:disable-next-line
    userRepository = availabilityService['userRepository'];
  });

  afterAll(async () => {
    await flushDb();
  });

  beforeEach(async () => {
    await flushDb();

    // populate
    dbUser = await userRepository.save(Object.assign(new UserEntity(), user));
  });

  describe('test', () => {
    it('should throw ValidaitonException if user with given credentials is found', async () => {
      await expect(availabilityService.test(user, [
        { property: 'name', value: user.name },
        { property: 'email', value: user.email },
      ])).rejects.toBeInstanceOf(ValidationException);
    });

    it('should\'t throw an error if credentials are available', async () => {
      await expect(availabilityService.test(user, [
        { property: 'name', value: 'kek2' },
        { property: 'email', value: 'kek2@example.com' },
      ])).resolves.not.toBeInstanceOf(ValidationException);
    });
  });

});
