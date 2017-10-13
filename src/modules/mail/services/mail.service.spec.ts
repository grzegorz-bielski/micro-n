import { Test } from '@nestjs/testing';
import { Transporter, getTestMessageUrl } from 'nodemailer';
import { MailService } from './mail.service';
import { setUpConfig } from '../../../config/configure';
import { mailProviders } from '../providers/mail.providers';

describe('MailService', () => {
  let mailService: MailService;
  setUpConfig();

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      components: [
        ...mailProviders,
        MailService,
      ],
    }).compile();

    mailService = module.get<MailService>(MailService);

  });

  describe('sendEmail', () => {
    it('should send an email', async () => {
      const info = await mailService.sendEmail({
        to: 'test@example.com',
        subject: 'test',
        html: '<h1>Test email</h1>',
      });

      expect(info).toBeDefined();
      expect(info).not.toBe(null);
      console.log(`sendEmail preview: ${getTestMessageUrl(info)}`);
    });
  });

  describe('sendVerificationEmail', () => {
    it('should send verification email', async () => {
      const info = await mailService.sendVerificationEmail(
        'test@example.com',
        'fwefwf432f3434f3dssashh5',
      );

      expect(info).toBeDefined();
      expect(info).not.toBe(null);
      console.log(`sendVerificationEmail preview: ${getTestMessageUrl(info)}`);
    });
  });
});