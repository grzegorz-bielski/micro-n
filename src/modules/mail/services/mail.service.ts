import { Component, Inject, HttpStatus } from '@nestjs/common';
import { HttpException } from '@nestjs/core';
import { Transporter, SentMessageInfo, getTestMessageUrl } from 'nodemailer';
import { MailTransportToken } from '../../constants';
import { IsendEmail } from '../interfaces/mail.interface';
import { getConfig } from '../../../config/configure';

@Component()
export class MailService {
  private readonly generalOptions = {
    from: `"Micro-n 📧 service" <${getConfig('mail').user}>`,
  };

  constructor(
    @Inject(MailTransportToken)
    private readonly transporter: Transporter,
  ) {}

  public sendVerificationEmail(to: string, link: string): Promise<SentMessageInfo> {
    const html = `
      <h1>Thank you for registering to micro-n!</h1>
      <p>Click <b><a href="${link}">here</a></b> to verify your email account.
    `;
    const subject = 'Confirm your email account';
    return this.sendEmail(Object.assign({}, { to, subject, html }));
  }

  public async sendEmail(options: IsendEmail): Promise<SentMessageInfo> {
    try {
      const info: SentMessageInfo =  await this.transporter.sendMail(Object.assign(this.generalOptions, options));

      // log link to preview in test env
      if (process.env.NODE_ENV === 'test') {
        console.log(`Test email preview: ${ getTestMessageUrl(info)}`);
      }

      return info;
    } catch (error) {
      console.log(error);
      throw new HttpException('Couldn\'t send verification email, try again later.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
