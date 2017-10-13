import { Component, Inject, HttpStatus } from '@nestjs/common';
import { HttpException } from '@nestjs/core';
import * as crypto from 'crypto';

import { RedisClientToken } from '../../constants';
import { IRedisClientPromisifed } from '../../database/interfaces/database.interface';
import { MailService } from '../../mail/services/mail.service';
import { UsersService } from '../services/users.service';

interface IverificationData {
  id: string;
  email: string;
  host: string;
  protocol: string;
}

@Component()
export class VerificationService {
  private readonly redisError = 'Couldn\'t send verification email, try again later.';

  constructor(
    @Inject(RedisClientToken)
    private readonly redisClient: IRedisClientPromisifed,
    private readonly mailService: MailService,
  ) {}

  public async sendVerificationEmail(data: IverificationData): Promise<void> {
    // check if id already exists in DB
    await this.checkIfExists(data.id);

    // generate hash & link
    const hash = crypto.randomBytes(20).toString('hex');
    const link = `${data.protocol}://${data.host}/api/users/verify?hash=${hash}`;

    // send email
    await this.mailService.sendVerificationEmail(data.email, link);

    // store { hash: userId } in DB for future check in /users/verify route
    this.redisClient.set(hash, data.id);
    this.redisClient.expire(data.id, 1200);
  }

  public async verify(hash: string) {
    let id: string;

    // find hash in DB
    try {
      id = await this.redisClient.getAsync(hash);
    } catch (error) {
      throw new HttpException(this.redisError, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    if (!id) {
      throw new HttpException('Invalid email address.', HttpStatus.BAD_REQUEST);
    }

    return id;
  }

  public async deleteHash(hash) {
    let reply;

    // delete hash from DB
    try {
      reply = await this.redisClient.delAsync(hash);
    } catch (error) {
      throw new HttpException(this.redisError, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    if (reply !== 1) {
      throw new HttpException(this.redisError, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private async checkIfExists(data: string): Promise<void> {
    let info: any;

    try {
      info = await this.redisClient.existsAsync(data);
    } catch (error) {
      console.log(error);
      throw new HttpException(this.redisError, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    if (info === 1) {
      throw new HttpException('Verification for that email has been already requested!', HttpStatus.CONFLICT);
    }
  }

}