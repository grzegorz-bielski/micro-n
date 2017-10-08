import { Module } from '@nestjs/common';
import { mailProviders } from './mail.providers';
import { MailService } from './mail.service';

@Module({
  components: [
    ...mailProviders,
    MailService,
  ],
  exports: [ MailService ],
})
export class MailModule {}