import * as crypto from 'crypto';
import { Test } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { setUpConfig } from '../../../config/configure';

import { DatabaseModule } from '../../database/database.module';
import { MailModule } from '../../mail/mail.module';

import { userProviders } from '../providers/users.providers';
import { MailService } from '../../mail/services/mail.service';
import { VerificationService } from '../services/verification.service';
import { IRedisClientPromisifed } from '../../database/interfaces/database.interface';

describe('VerificationService', () => {
  const id: number = 3;
  const id2: number = 7;
  let hash: string;
  let hash2: string;

  let verificationService: VerificationService;
  let redisClient: IRedisClientPromisifed;
  let mailService: MailService;

  setUpConfig();

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      modules: [
        DatabaseModule,
        MailModule,
    ],
    components: [
        ...userProviders,
        VerificationService,
    ],
    }).compile();

    const mailModule = module.select<MailModule>(MailModule);

    verificationService = module.get<VerificationService>(VerificationService);
    mailService = mailModule.get<MailService>(MailService);

    // hack to get easy access to private dependency for testing. Don't do it at home.
    // tslint:disable-next-line
    redisClient = verificationService['redisClient'];
  });

  beforeEach(async () => {
    // flush all
    try {
      await redisClient.flushallAsync();
    } catch (error) {
      console.log(error);
    }

    // generate hash
    hash = crypto.randomBytes(20).toString('hex');
    hash2 = crypto.randomBytes(20).toString('hex');

    // populate
    try {
      await Promise.all([
        redisClient.setAsync(hash, id),
        redisClient.setAsync(hash2, id2),
      ]);
    } catch (error) {
      console.log(error);
    }
  });

  describe('deleteHash', () => {
    it('should throw an HttpException if there is no hash in DB', async () => {
      try {
        await verificationService.deleteHash('324234324234sorandom');
      } catch (error) {
        expect(error).toBeDefined();
        expect(error).toBeInstanceOf(HttpException);
      }
    });

    it('should delete hash from db', async () => {
      const firstReply = await redisClient.getAsync(hash);

      expect(firstReply).toBeDefined();
      expect(firstReply).not.toBe(null);

      await verificationService.deleteHash(hash);

      const secondReply = await redisClient.getAsync(hash);

      expect(secondReply).toBe(null);

    });
  });

  describe('verify', () => {
    it('should throw HttpException for hash that is not stored in DB', async () => {
      try {
        await verificationService.verify('fwfwefw4ferkrandooom');
      } catch (error) {
        expect(error).toBeDefined();
        expect(error).toBeInstanceOf(HttpException);
      }
    });

    it('should return id of user if his/her hash is stored in DB', async () => {
      const userId = await verificationService.verify(hash);

      expect(userId).toBeDefined();
      expect(userId).not.toBe(null);
      expect(userId).toBe(id.toString());
    });
  });

  describe('sendVerificationEmail', () => {
    const verificationData =  {
      id: id.toString(),
      email: 'kek@example.com',
      host: 'localhost:3000',
      protocol: 'http',
    };

    it('should call appropriate method on mailService', async () => {
      const mailServiceMock = jest
        .spyOn(mailService, 'sendVerificationEmail')
        .mockImplementation(() => true);

      await verificationService.sendVerificationEmail(verificationData);

      expect(mailServiceMock).toHaveBeenCalled();
      expect(mailServiceMock).toHaveBeenCalledTimes(1);
    });

    it('should store hash in DB as a `hash: userId` ', async () => {
      const { hash: emailHash } = await verificationService.sendVerificationEmail(verificationData);
      let reply: string;

      try {
        reply = await redisClient.getAsync(hash);
      } catch (error) {
        console.log(error);
      }

      expect(emailHash).toBeDefined();
      expect(typeof emailHash).toBe('string');
      expect(reply).toBe(verificationData.id);

    });

    it('should set expiration on created hashes', async () => {
      const { hash: emailHash } = await verificationService.sendVerificationEmail(verificationData);
      const timeToLive = await redisClient.ttlAsync(emailHash);

      expect(timeToLive).toBeDefined();
      expect(timeToLive).not.toBe(null);
      expect(typeof timeToLive).toBe('number');
      expect(timeToLive).toBeLessThanOrEqual(1200);
    });
  });
});