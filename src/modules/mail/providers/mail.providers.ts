import * as nodemailer from 'nodemailer';
import * as smtpTransport from 'nodemailer-smtp-transport';
import { MailTransportToken } from '../../constants';
import { ImailProviders } from '../interfaces/providers.interface';
import { getConfig } from '../../../config/configure';

// Types for some 4.1.4 Nodemailer functions, not yet provided in @types/nodemailer
declare module 'nodemailer' {
  export function createTestAccount(callback?: (error: any, account: object) => void): any;
  export function getTestMessageUrl(info: any);

}

export const mailProviders: ImailProviders[] = [
  {
    provide: MailTransportToken,
    useFactory: async () => {
      let options: smtpTransport.SmtpOptions;
      if (process.env.NODE_ENV === 'test') {
        try {
          const account = await nodemailer.createTestAccount();
          options = {
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: account.user,
                pass: account.pass,
            },
          };
        } catch (error) {
          console.log(error);
        }
      } else {
        const config = getConfig('mail');
        options = {
          service: 'gmail',
          auth: {
            type: 'OAuth2',
            user: config.user,
            clientId: config.id,
            clientSecret: config.secret,
            refreshToken: config.refreshToken,
            accessToken: config.accessToken,
          },
        };
      }

      return nodemailer.createTransport(options);
    },
  },
];
