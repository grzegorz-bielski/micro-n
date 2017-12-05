import { Connection, Repository } from 'typeorm';
import { TagEntity } from '../entities/tag.entity';
import { TagRepositoryToken, MySQLConnectionToken } from '../../constants';

export const tagProviders = [
  {
    provide: TagRepositoryToken,
    useFactory: (connection: Connection) => connection.getRepository(TagEntity),
    inject: [ MySQLConnectionToken ],
  },
];