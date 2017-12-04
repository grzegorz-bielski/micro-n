import { Component, Inject, HttpStatus } from '@nestjs/common';
import { HttpException } from '@nestjs/core';
import { Transporter, SentMessageInfo, getTestMessageUrl } from 'nodemailer';
import { MailTransportToken } from '../../constants';
import { IsendEmail } from '../interfaces/mail.interface';
import { getConfig } from '../../../config/configure';

// TODO:
// - templates
// - more configuration
@Component()
export class MailService {
  private readonly transportOptions = {
    from: `"Micro-n 📧 service" <${getConfig('mail').user}>`,
  };

  private readonly clientOptions = {
    webApp: `www.webapp.com`,
  };

  constructor(
    @Inject(MailTransportToken)
    private readonly transporter: Transporter,
  ) {}

  public sendVerificationEmail(to: string, hash: string): Promise<SentMessageInfo> {
    const html = `
      <h1>Thank you for registering to micro-n!</h1>
      <p>Here is your verification code:</p></br>
      <b>${hash}</b></br>
      <p>Paste it to the <a href="${this.clientOptions.webApp}/verify">${this.clientOptions.webApp}/verify<a/></p>
    `;
    const subject = 'Confirm your email account';
    return this.sendEmail({ to, subject, html });
  }

  public sendResetPasswordRequestEmail(to: string, hash: string): Promise<SentMessageInfo> {
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

  public async sendEmail(options: IsendEmail): Promise<SentMessageInfo> {
    try {
      const info: SentMessageInfo =  await this.transporter.sendMail(Object.assign(this.transportOptions, options));

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
