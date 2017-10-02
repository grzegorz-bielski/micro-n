import { Connection, Repository } from 'typeorm';
import { UserEntity } from './user.entity';
import { UserRepositoryToken, MySQLConnectionToken } from '../constants';

export const userProviders = [
  {
    provide: UserRepositoryToken,
    useFactory: (connection: Connection) => connection.getRepository(UserEntity),
    inject: [ MySQLConnectionToken ],
  },
];
