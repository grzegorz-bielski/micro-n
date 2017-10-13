import { Component, Inject, HttpStatus } from '@nestjs/common';
import { HttpException } from '@nestjs/core';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';

import { RedisClientToken } from '../../constants';
import { IRedisClientPromisifed } from '../../database/interfaces/database.interface';

export interface IaccessTokenData {
  id: number;
  roles: string;
}

export interface IrefreshTokenData {
  id: number;
  refreshToken: string;
}

export interface IrefershTokenRedis {
  token: string;
  roles: string;
  created: number;
}

export interface IAuthService {
  createAccessToken(data: IaccessTokenData): Promise<string>;
  refreshAccessToken(data: IrefreshTokenData): Promise<string>;
  createRefreshToken(data: IaccessTokenData): Promise<string>;
  revokeRefreshToken(data: IrefreshTokenData): Promise<void>;
  getAllRefreshTokens(id: number): Promise<IrefershTokenRedis[]>;
}

@Component()
export class AuthService implements IAuthService {
  private readonly defaultOptions: jwt.SignOptions = {
    expiresIn: '1h',
  };
  private readonly tokenField = 'refreshTokens';

  constructor( @Inject(RedisClientToken) private readonly redisClient: IRedisClientPromisifed ) {}

  public async createAccessToken(data: IaccessTokenData, options: jwt.SignOptions = this.defaultOptions): Promise<string> {
    let token: string;

    try {
      token = (await this.sign(data, options)).toString();
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return token;
  }

  public async refreshAccessToken(data: IrefreshTokenData): Promise<string> {
    const userId: string = `user-${data.id}`;

    // check if id exists in DB
    await this.checkIfExists(userId);

    // get token
    const refreshTokenObj = await this.getRefreshTokenObj(data);

    // return new access token
    return this.createAccessToken({ id: data.id, roles: refreshTokenObj.roles });
  }

  public async getAllRefreshTokens(id: number): Promise<IrefershTokenRedis[]> {
    const userId: string = `user-${id}`;

    // check if id exists in DB
    await this.checkIfExists(userId);

    // get all refresh tokens
    const refreshTokens: IrefershTokenRedis[] = await this.getRefreshTokens(id);

    if (refreshTokens.length <= 0) {
      throw new HttpException('This user doesn\'t have any refresh tokens.', HttpStatus.NOT_FOUND);
    }

    return refreshTokens;
  }

  public async createRefreshToken(data: IaccessTokenData): Promise<string> {
    const token: string = crypto.randomBytes(20).toString('hex');
    const userId: string = `user-${data.id}`;
    const refreshTokens: IrefershTokenRedis[] = await this.getRefreshTokens(data.id) || [];

    // add new token & save it to the DB
    refreshTokens.push({
      token,
      created: Date.now(),
      roles: data.roles,
    });

    try {
      await this.redisClient.hsetAsync(userId, this.tokenField, JSON.stringify(refreshTokens));
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return token;
  }

  public async revokeRefreshToken(data: IrefreshTokenData): Promise<void> {
    const userId: string = `user-${data.id}`;

    // check if id exists in DB
    await this.checkIfExists(userId);

    // get tokens
    const refreshTokens: IrefershTokenRedis[] = await this.getRefreshTokens(data.id);

    // remove token
    try {
      await this.redisClient.hsetAsync(
        userId,
        this.tokenField,
        JSON.stringify(refreshTokens.filter(tokenObj => tokenObj.token !== data.refreshToken)));
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }

  }

  public async revokeAllRefreshTokens(id: number): Promise<void> {
    const userId: string = `user-${id}`;

    // check if id exists in DB
    await this.checkIfExists(userId);

    // delete
    try {
      await this.redisClient.hdelAsync(userId, this.tokenField);
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private async getRefreshTokens(id: number): Promise<IrefershTokenRedis[]> {
    const userId: string = `user-${id}`;
    let reply: number;

    try {
      reply = await this.redisClient.existsAsync(userId);
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    if (reply === 1) {
      const refreshTokensString: string = await this.redisClient.hgetAsync(userId, this.tokenField);
      const refreshTokens =  JSON.parse(refreshTokensString);

      return refreshTokens;
    }

    return null;
  }

  private async getRefreshTokenObj(data: IrefreshTokenData, refreshTokens: IrefershTokenRedis[] = null): Promise<IrefershTokenRedis> {
    // if tokens weren't provided -> find them
    if (!refreshTokens) {
      refreshTokens = await this.getRefreshTokens(data.id);
    }

    const refreshTokenObj: IrefershTokenRedis = refreshTokens
      .find(tokenObj => tokenObj.token === data.refreshToken);

    if (!refreshTokenObj) {
      throw new HttpException('There is no such refresh token.', HttpStatus.NOT_FOUND);
    }

    return refreshTokenObj;
  }

  private async checkIfExists(userId: string): Promise<void> {
    let reply: number;

    // check if id exists in DB
    try {
      reply = await this.redisClient.existsAsync(userId);
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    if (reply === 0) {
      throw new HttpException('There is no user with such ID', HttpStatus.NOT_FOUND);
    }
  }

  private sign(data: object, options: jwt.SignOptions) {
    return new Promise((resolve, reject) => {
      jwt.sign(data, process.env.JWT_SECRET, options, (error, token) => {
        if (error || !token) {
          reject(error);
        } else {
          resolve(token);
        }
      });
    });
  }
}
