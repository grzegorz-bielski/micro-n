import { promisify } from 'util';
import * as nodemailer from 'nodemailer';
import * as smtpTransport from 'nodemailer-smtp-transport';
import { MailTransportToken } from '../../constants';
import { ImailProviders } from '../interfaces/providers.interface';

// dummy types for some 4.1.4 Nodemailer functions, not yet provided in @types/nodemailer
declare module 'nodemailer' {
  function createTestAccount(callback: any): any;
}

export const mailProviders: ImailProviders[] = [
  {
    provide: MailTransportToken,
    useFactory: async () => {
      let transporter: nodemailer.Transporter;

      if (process.env.NODE_ENV === 'test') {
        try {
          const account: any = await promisify(nodemailer.createTestAccount)();
          transporter = nodemailer.createTransport({
            host: account.smtp.host,
            port: account.smtp.port,
            secure: account.smtp.secure,
            auth: {
                user: account.user,
                pass: account.pass,
            },
          });
        } catch (error) {
          console.log(error);
        }
      } else {
        transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            type: 'OAuth2',
            user: process.env.MAIL_USER,
            clientId: process.env.MAIL_ID,
            clientSecret: process.env.MAIL_SECRET,
            refreshToken: process.env.MAIL_REFRESH_TOKEN,
            accessToken: process.env.MAIL_ACCESS_TOKEN,
          },
        });
      }

      return transporter;
    },
  },
];
