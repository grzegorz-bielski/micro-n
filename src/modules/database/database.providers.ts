import { createConnection } from 'typeorm';
import { MySQLConnectionToken } from '../constants';
import { UserEntity } from '../users/user.entity';
import { ConnectionStringParser } from './ConnectionStringParser';

const options = new ConnectionStringParser(process.env.DATABASE_URL);

export const databaseProviders = [
  {
    provide: MySQLConnectionToken,
    useFactory: async () => await createConnection({
      type: 'mysql',
      host: options.host,
      port: options.port,
      username: options.username,
      password: options.password,
      database: options.database,
      entities: [
        UserEntity,
      ],
      autoSchemaSync: true,
    }),
  },
];
