import { Component, Inject, HttpStatus } from '@nestjs/common';
import { HttpException } from '@nestjs/core';
import { Transporter } from 'nodemailer';
import { MailTransportToken } from '../constants';
import config from '../../config/config';

interface IsendEmail {
  to: string;
  subject: string;
  html: string;
}

@Component()
export class MailService {
  private readonly generalOptions = {
    from: `"Micro-n 📧 service" <${config.mail.user}>`,
  };

  constructor(
    @Inject(MailTransportToken)
    private readonly transporter: Transporter,
  ) {}

  public sendVerificationEmail(to: string, link: string): void {
    const html = `
      <h1>Thank you for registering to micro-n!</h1>
      <p>Click <b><a href="${link}">here</a></b> to verify your email account.
    `;
    const subject = 'Confirm your email account';
    this.sendEmail(Object.assign({}, { to, subject, html }));
  }

  public async sendEmail(options: IsendEmail): Promise<void> {
    try {
      await this.transporter.sendMail(Object.assign(this.generalOptions, options));
    } catch (error) {
      console.log(error);
      throw new HttpException('Couldn\'t send verification email, try again later.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
