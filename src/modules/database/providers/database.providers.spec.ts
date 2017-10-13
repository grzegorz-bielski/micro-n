import { Connection } from 'typeorm';
import { setUpConfig } from '../../../config/configure';
import { databaseProviders } from './database.providers';
import { IRedisClientPromisifed } from './../interfaces/database.interface';

describe('databaseProviders', () => {

  describe('MySQLConnection', () => {
    it('should throw error if there is no set MYSQL_URL env variable', async () => {
      try {
        await databaseProviders[0].useFactory();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should create a connection if valid MYSQL_URL env variable is set', async () => {
      setUpConfig();
      const connection: Connection = await databaseProviders[0].useFactory() as Connection;

      expect(connection).toBeDefined();
      expect(connection).not.toBe(null);

      connection.close();
    });
  });

  describe('RedisClient', () => {
    it('should create redis client on default config if not REDIS_URL env variable is set', async () => {
      setUpConfig();
      const redisClient: IRedisClientPromisifed = await databaseProviders[1].useFactory() as IRedisClientPromisifed;

      expect(redisClient).toBeDefined();
    });

    it('should create a promisifed client', async () => {
      setUpConfig();
      const redisClient: IRedisClientPromisifed = await databaseProviders[1].useFactory() as IRedisClientPromisifed;

      expect(redisClient.hset).toBeDefined();
      expect(redisClient.hsetAsync).toBeDefined();
    });
  });
});