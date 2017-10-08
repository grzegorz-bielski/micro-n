import * as nodemailer from 'nodemailer';
import * as smtpTransport from 'nodemailer-smtp-transport';
import { MailTransportToken } from '../constants';
import config from '../../config/config';

export const mailProviders = [
  {
    provide: MailTransportToken,
    useFactory: () => {
      const options: smtpTransport.SmtpOptions = {
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: config.mail.user,
          clientId: config.mail.id,
          clientSecret: config.mail.secret,
          refreshToken: config.mail.refreshToken,
          accessToken: config.mail.accessToken,
        },
      };

      return nodemailer.createTransport(options);
    },
  },
];
