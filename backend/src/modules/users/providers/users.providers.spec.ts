import 'jest';
import { Connection, Repository } from 'typeorm';
import { databaseProviders } from '../../database/providers/database.providers';
import { UserEntity } from './../entities/user.entity';
import { setUpConfig } from '../../../config/configure';
import { userProviders } from './users.providers';

describe('userProviders', () => {
  describe('userRepository', () => {
    setUpConfig();

    it('should create user repository', async () => {
      const connectionMock = await databaseProviders[0].useFactory();
      jest.spyOn(connectionMock, 'getRepository');

      const userRepository: Repository<UserEntity> = await userProviders[0].useFactory(connectionMock);

      expect(userRepository).toBeDefined();
      expect(userRepository).toBeInstanceOf(Repository);
      expect(connectionMock.getRepository).toBeCalledWith(UserEntity);
    });
  });
});