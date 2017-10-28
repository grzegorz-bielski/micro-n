import { Connection, Repository } from 'typeorm';
import { PostEntity } from '../entities/post.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { PostRepositoryToken, UserRepositoryToken, MySQLConnectionToken } from '../../constants';

export const postProviders = [
  {
    provide: PostRepositoryToken,
    useFactory: (connection: Connection) => connection.getRepository(PostEntity),
    inject: [ MySQLConnectionToken ],
  },
  {
    provide: UserRepositoryToken,
    useFactory: (connection: Connection) => connection.getRepository(UserEntity),
    inject: [ MySQLConnectionToken ],
  },
];