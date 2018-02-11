import { Component, Inject, HttpStatus, HttpException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { MailTransportToken } from '../../constants';
import { IsendEmail } from '../interfaces/mail.interface';

// dummy types for some 4.1.4 Nodemailer functions, not yet provided in @types/nodemailer
declare module 'nodemailer' {
  function getTestMessageUrl(info: any);
}

// TODO:
// - templates
// - more configuration
@Component()
export class MailService {
  private readonly transportOptions = {
    from: `"Micro-n 📧 service" <${process.env.MAIL_USER}>`,
  };

  private readonly clientOptions = {
    webApp: `www.webapp.com`,
  };

  constructor(
    @Inject(MailTransportToken)
    private readonly transporter: nodemailer.Transporter,
  ) {}

  public sendVerificationEmail(to: string, hash: string): Promise<nodemailer.SentMessageInfo> {
    const html = `
      <h1>Thank you for registering to micro-n!</h1>
      <p>Here is your verification code:</p></br>
      <b>${hash}</b></br>
      <p>Paste it to the <a href="${this.clientOptions.webApp}/verify">${this.clientOptions.webApp}/verify<a/></p>
    `;
    const subject = 'Confirm your email account';
    return this.sendEmail({ to, subject, html });
  }

  public sendResetPasswordRequestEmail(to: string, hash: string): Promise<nodemailer.SentMessageInfo> {
    const html = `
      <h1>There has been a request to reset your password.</h1>
      <p>Here is your reset password code:</p></br>
      <b>${hash}</b></br>
      <p>Paste it to the <a href="${this.clientOptions.webApp}/passwordreset">${this.clientOptions.webApp}/passwordreset<a/></p>
      <p>If it wasn't you then ignore this message</p>
    `;
    const subject = 'Confirm your email account';
    return this.sendEmail({ to, subject, html });
  }

  public async sendEmail(options: IsendEmail): Promise<nodemailer.SentMessageInfo> {
    try {
      const info: nodemailer.SentMessageInfo =  await this.transporter.sendMail(Object.assign(this.transportOptions, options));

      // log link to preview in test env
      if (process.env.NODE_ENV === 'test') {
        console.log(`Test email preview: ${ nodemailer.getTestMessageUrl(info)}`);
      }

      return info;
    } catch (error) {
      console.log(error);
      throw new HttpException('Couldn\'t send verification email, try again later.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
