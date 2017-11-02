import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import { promisify } from 'util';
import { Test } from '@nestjs/testing';
import { HttpException } from '@nestjs/core';
import { UnauthorizedException } from '../../common/exceptions/unauthorized.exception';
import { AuthMiddleware, IparsedData } from '../middlewares/auth.middleware';
import { setUpConfig } from '../../../config/configure';
import { AuthService, IrefershTokenRedis, IaccessTokenData } from '../services/auth.service';
import { DatabaseModule } from '../../database/database.module';
import { RedisClientToken } from '../../constants';
import { IRedisClientPromisifed } from '../../database/interfaces/database.interface';

const decodeAsync = promisify(jwt.decode);
const verifyAsync = promisify(jwt.verify);

describe('AuthService', () => {
  const refreshTokens: IrefershTokenRedis[] = [];
  const numberOfTokens: number = 5;
  const id: number = 3;
  const id2: number = 4;
  const userId: string = `user-${id}`;
  const userId2: string = `user-${id2}`;

  let authService: AuthService;
  let redisClient: IRedisClientPromisifed;

  setUpConfig();

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      modules: [
        DatabaseModule,
      ],
      components: [
        AuthService,
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);

    // hack to get easy access to private dependency for testing. Don't do it at home.
    // tslint:disable-next-line
    redisClient = authService['redisClient'];

  });

  beforeEach(async () => {
    // flush all
    try {
      await redisClient.flushallAsync();
    } catch (error) {
      console.log(error);
    }
    // create tokens
    for (let i = 0; i <= numberOfTokens; i++) {
      refreshTokens.push({
        token: crypto.randomBytes(20).toString('hex'),
        created: Date.now(),
        roles: JSON.stringify(['user']),
      });
    }
    // populate
    try {
      await Promise.all([
        redisClient.hsetAsync(userId, 'refreshTokens', JSON.stringify(refreshTokens)),
        redisClient.hsetAsync(userId2, 'refreshTokens', JSON.stringify([])),
      ]);
    } catch (error) {
      console.log(error);
    }
  });

  describe('createAccessToken', () => {
    it('should create a new valid access token with hashed data', async () => {
      const dataToHash = {
        id,
        roles: ['user'],
      };
      const accessToken = await authService.createAccessToken({
        id: dataToHash.id,
        roles: JSON.stringify(dataToHash.roles),
      });
      const decodedData: any = await verifyAsync(accessToken, process.env.JWT_SECRET);

      expect(accessToken).toBeDefined();
      expect(decodedData).toBeDefined();
      expect(typeof accessToken).toBe('string');
      expect(decodedData.id).toBe(dataToHash.id);
      expect(JSON.parse(decodedData.roles)).toEqual(dataToHash.roles);
    });

    it('should create tokens with non-default options if provided', async () => {
      const dataToHash = {
        id,
        roles: ['user'],
      };
      const accessToken: string = await authService.createAccessToken({
        id: dataToHash.id,
        roles: JSON.stringify(dataToHash.roles),
      }, { expiresIn: '0s' });

      await expect(verifyAsync(accessToken, process.env.JWT_SECRET))
        .rejects
        .toBeDefined();
      expect(accessToken).toBeDefined();
    });
  });

  describe('refreshAccessToken', () => {
    it('should throw HttpException if there is no user with given id', async () => {
      await expect(authService.refreshAccessToken({
        id: 9,
        refreshToken: refreshTokens[0].token,
      })).rejects.toBeInstanceOf(HttpException);
    });

    it('should throw HttpException if there is no such refresh token in DB', async () => {
      await expect(authService.refreshAccessToken({
        id,
        refreshToken: crypto.randomBytes(20).toString('hex'),
      })).rejects.toBeInstanceOf(HttpException);
    });

    it('should create new access token if refresh token is valid', async () => {
      const token: string = await authService.refreshAccessToken({
        id,
        refreshToken: refreshTokens[0].token,
      });

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });
  });

  describe('getAllRefreshTokens', () => {
    it('should throw HttpException if there is no user with given id', async () => {
      await expect(authService.getAllRefreshTokens(5))
        .rejects
        .toBeInstanceOf(HttpException);
    });

    it('should throw HttpException if existent user with given id doesn\'t have any refresh tokens', async () => {
      await expect(authService.getAllRefreshTokens(id2))
        .rejects
        .toBeInstanceOf(HttpException);
    });

    it('should return all refresh tokens for given id', async () => {
      const tokens: IrefershTokenRedis[] = await authService.getAllRefreshTokens(id);

      expect(tokens).toEqual(refreshTokens);
    });
  });

  describe('createRefreshToken', () => {
    it('should create new refresh token', async () => {
      const token: string = await authService.createRefreshToken({
        id,
        roles: JSON.stringify(['user']),
      });

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('should put new refresh token to the DB', async () => {
      const token: string = await authService.createRefreshToken({
        id,
        roles: JSON.stringify(['user']),
      });

      const dbTokensString: string = await redisClient.hgetAsync(userId, 'refreshTokens');
      const dbTokens: IrefershTokenRedis[] = JSON.parse(dbTokensString);

      expect(dbTokens).toBeDefined();
      expect(dbTokens).not.toBe(null);

      const dbToken: string = dbTokens.find(tokenObj => tokenObj.token === token).token;

      expect(token).toBe(dbToken);
    });
  });

  describe('revokeRefreshToken', () => {
    it('should throw HttpException if there is no user with given id', async () => {
      await expect(authService.revokeRefreshToken({
        id: 9,
        refreshToken: refreshTokens[0].token,
      })).rejects.toBeInstanceOf(HttpException);
    });

    it('should delete refresh token if id & token is found', async () => {
      await authService.revokeRefreshToken({
        id,
        refreshToken: refreshTokens[0].token,
      });

      const dbTokensString: string = await redisClient.hgetAsync(userId, 'refreshTokens');
      const dbTokens: IrefershTokenRedis[] = JSON.parse(dbTokensString);

      expect(dbTokens).toBeDefined();
      expect(dbTokens).not.toBe(null);

      const dbToken = dbTokens.find(tokenObj => tokenObj.token === refreshTokens[0].token);
      expect(dbToken).toBeUndefined();
    });
  });

  describe('revokeAllRefreshTokens', () => {
    it('should throw HttpException if there is no user with given id', async () => {
      await expect(authService.revokeAllRefreshTokens(9))
        .rejects
        .toBeInstanceOf(HttpException);
    });

    it('should delete all refresh tokens for given id', async () => {
      await authService.revokeAllRefreshTokens(id);

      const dbTokensString: string = await redisClient.hgetAsync(userId, 'refreshTokens');

      expect(dbTokensString).toBe(null);

    });
  });

});
