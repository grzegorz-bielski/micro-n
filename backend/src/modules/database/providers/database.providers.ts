import { URL } from 'url';
import * as redis from 'redis';
import { createConnection, Connection } from 'typeorm';

import { promisifyAll } from '../../common/util/promisifyAll';
import { IdatabaseProviders } from './../interfaces/providers.interface';
import { IRedisClientPromisifed } from './../interfaces/database.interface';
import { MySQLConnectionToken, RedisClientToken } from '../../constants';

// entities
import { UserEntity } from '../../users/entities/user.entity';
import { TagEntity } from '../../tags/entities/tag.entity';
import { PostEntity } from '../../posts/entities/post.entity';
import { PostImageEntity } from '../../posts/entities/post-image.entity';
import { PostVoteEntity } from '../../posts/entities/post-vote.entity';
import { CommentEntity } from '../../comments/entities/comment.entity';
import { CommentImageEntity } from '../../comments/entities/comment-image.entity';
import { CommentVoteEntity } from '../../comments/entities/comment-vote.entity';

let mysqlConnectionCounter = 0;

Object.keys(process.env)
  .forEach(envVar => console.log(`${envVar}: ${process.env[envVar]}`));

export const databaseProviders: IdatabaseProviders[] = [
  {
    provide: MySQLConnectionToken,
    useFactory: async () => {
      let connection: Connection;

      try {
        connection = await createConnection({
          name: `connection-${mysqlConnectionCounter}`,
          type: 'mysql',
          host: process.env.MYSQL_HOST,
          port: Number.parseInt(process.env.MYSQL_PORT),
          username: process.env.MYSQL_USER,
          password: process.env.MYSQL_PASSWORD,
          database: process.env.MYSQL_DATABASE,
          entities: [
            UserEntity,
            TagEntity,
            PostEntity,
            PostImageEntity,
            PostVoteEntity,
            CommentEntity,
            CommentImageEntity,
            CommentVoteEntity,
          ],
          connectTimeout: 30 * 1000,
          synchronize: process.env.NODE_ENV === 'production' ? false : true,
          // logging: ['error', 'warn'],
        });
      } catch (error) {
        console.log('Couldn\' connect to the MySQL DB.');
        console.log('details:', error);
        return;
      }

      mysqlConnectionCounter++;
      return connection;
    },
  },
  {
    provide: RedisClientToken,
    useFactory: async () => {
      const db = process.env.REDIS_DATABASE;
      let redisClient: IRedisClientPromisifed;

      // Promisify all methods!
      // before:
      //  redisClient[method](data, callback);
      // after:
      //  const info: Promise<T> = redisClient[methodAsync](data);
      promisifyAll(redis.RedisClient.prototype);
      promisifyAll(redis.Multi.prototype);

      redisClient = redis.createClient({
        host: process.env.REDIS_HOST,
        port: Number.parseInt(process.env.REDIS_PORT),
      });

      try {
        await redisClient.selectAsync(db);
      } catch (error) {
        console.log(`Couldn\' connect to the Redis DB from ${db} namespace.`);
        console.log('details: ', error);
      }
      
      return redisClient;
    },
  },
];
