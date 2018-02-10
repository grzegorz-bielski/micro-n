import { Module } from '@nestjs/common';
import { mailProviders } from './providers/mail.providers';
import { MailService } from './services/mail.service';

@Module({
  components: [
    ...mailProviders,
    MailService,
  ],
  exports: [ MailService ],
})
export class MailModule {}