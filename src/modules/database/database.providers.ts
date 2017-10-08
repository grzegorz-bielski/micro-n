import { URL } from 'url';
import * as redis from 'redis';
import { createConnection } from 'typeorm';
import { promisifyAll } from '../common/util/promisifyAll';
import { IRedisClientPromisifed } from './database.interface';
import { MySQLConnectionToken, RedisClientToken } from '../constants';
import { UserEntity } from '../users/user.entity';

const mysqlConfig = new URL(process.env.DATABASE_URL);

export const databaseProviders = [
  {
    provide: MySQLConnectionToken,
    useFactory: async () => await createConnection({
      type: 'mysql',
      host: mysqlConfig.hostname,
      port: Number.parseInt(mysqlConfig.port),
      username: mysqlConfig.username,
      password: mysqlConfig.password,
      database: mysqlConfig.pathname.substr(1),
      entities: [
        UserEntity,
      ],
      autoSchemaSync: true,
    }),
  },
  {
    provide: RedisClientToken,
    useFactory: () => {
      let redisClient: IRedisClientPromisifed;

      promisifyAll(redis.RedisClient.prototype);
      promisifyAll(redis.Multi.prototype);

      if (process.env.REDIS_URL) {
        redisClient = redis.createClient(process.env.REDIS_URL);
      } else {
        redisClient = redis.createClient();
      }

      return redisClient;
    },
  },
];
