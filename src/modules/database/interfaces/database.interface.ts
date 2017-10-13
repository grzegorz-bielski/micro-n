import * as redis from 'redis';

export interface IRedisClientPromisifed extends redis.RedisClient {
  [x: string]: any;
}
