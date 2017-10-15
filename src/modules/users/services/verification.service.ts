import { Component, Inject, HttpStatus } from '@nestjs/common';
import { HttpException } from '@nestjs/core';
import * as crypto from 'crypto';

import { RedisClientToken } from '../../constants';
import { IRedisClientPromisifed } from '../../database/interfaces/database.interface';
import { MailService } from '../../mail/services/mail.service';
import { UsersService } from '../services/users.service';

export interface IverificationData {
  id: string;
  email: string;
  host: string;
  protocol: string;
}

@Component()
export class VerificationService {
  private readonly hashExpiration: number = 1200;

  constructor(
    @Inject(RedisClientToken)
    private readonly redisClient: IRedisClientPromisifed,
    private readonly mailService: MailService,
  ) {}

  public async sendVerificationEmail(data: IverificationData): Promise<string> {
    // generate hash & link
    const hash: string = crypto.randomBytes(20).toString('hex');
    const link: string = `${data.protocol}://${data.host}/api/users/verify?hash=${hash}`;

    // store { hash: userId } in DB for future check in /users/verify route
    try {
      await Promise.all([
        this.redisClient.setAsync(hash, data.id),
        this.redisClient.expireAsync(hash, this.hashExpiration),
      ]);
    } catch (error) {
      throw new HttpException('Couldn\'t send verification email, try again later.', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // send email
    await this.mailService.sendVerificationEmail(data.email, link);

    return hash;
  }

  public async verify(hash: string) {
    let id: string;

    // find hash in DB
    try {
      id = await this.redisClient.getAsync(hash);
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    if (!id) {
      throw new HttpException('Invalid email address.', HttpStatus.BAD_REQUEST);
    }

    return id;
  }

  public async deleteHash(hash: string): Promise<void> {
    let reply: number;

    // delete hash from DB
    try {
      reply = await this.redisClient.delAsync(hash);
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    if (reply !== 1) {
      throw new HttpException('No results found', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private async checkIfExists(data: string): Promise<number> {
    let reply: number;

    try {
      reply = await this.redisClient.existsAsync(data);
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return reply;
  }

}