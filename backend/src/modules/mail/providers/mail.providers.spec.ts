import * as nodemailer from 'nodemailer';
import { setUpConfig } from '../../../config/configure';
import { mailProviders } from './mail.providers';

describe('mailProviders', () => {

  describe('MailTransport', () => {
    setUpConfig();

    it('should create a nodemailer transporter instance for given config', async () => {
      const transporter: nodemailer.Transporter = await mailProviders[0].useFactory();

      expect(transporter).toBeDefined();
    });
  });
});
