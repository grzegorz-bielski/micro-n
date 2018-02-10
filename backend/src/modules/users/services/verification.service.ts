import { Component, Inject, HttpStatus, HttpException } from '@nestjs/common';
import { SentMessageInfo } from 'nodemailer';
import * as crypto from 'crypto';

import { RedisClientToken } from '../../constants';
import { IRedisClientPromisifed } from '../../database/interfaces/database.interface';
import { MailService } from '../../mail/services/mail.service';
import { UsersService } from '../services/users.service';

export interface SendEmailData {
  id: string | number;
  email: string;
}

export interface SentHashData {
  hash: string;
  info: SentMessageInfo;
}

@Component()
export class VerificationService {
  private readonly hashExpiration: number = 1200;

  constructor(
    @Inject(RedisClientToken)
    private readonly redisClient: IRedisClientPromisifed,
    private readonly mailService: MailService,
  ) {}

  public async sendVerificationEmail(data: SendEmailData): Promise<SentHashData> {
    const hash: string = await this.generateAndStoreHash(data.id);
    const info: SentMessageInfo = await this.mailService.sendVerificationEmail(data.email, hash);
    return { hash, info };
  }

  public async sendResetPasswordRequest(data: SendEmailData): Promise<SentHashData> {
    const hash: string = await this.generateAndStoreHash(data.id);
    const info: SentMessageInfo = await this.mailService.sendResetPasswordRequestEmail(data.email, hash);
    return { hash, info };
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
      throw new HttpException('Hash not found.', HttpStatus.BAD_REQUEST);
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

  private async generateAndStoreHash(id: string | number): Promise<string> {
    const hash: string = crypto.randomBytes(20).toString('hex');
    // store { hash: userId } in DB for future check in /users/verify route
    try {
      await Promise.all([
        this.redisClient.setAsync(hash, id),
        this.redisClient.expireAsync(hash, this.hashExpiration),
      ]);
    } catch (error) {
      throw new HttpException('Couldn\'t store hash.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return hash;
  }

}