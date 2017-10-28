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
      let transporter: nodemailer.Transporter;

      if (process.env.NODE_ENV === 'test') {
        try {
          const { auth } = getConfig('mail');
          transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: auth.user,
                pass: auth.pass,
            },
          });
        } catch (error) {
          console.log(error);
        }
      } else {
        const { user, id, secret, refreshToken, accessToken } = getConfig('mail');
        transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            type: 'OAuth2',
            user,
            clientId: id,
            clientSecret: secret,
            refreshToken,
            accessToken,
          },
        });
      }

      return transporter;
    },
  },
];
