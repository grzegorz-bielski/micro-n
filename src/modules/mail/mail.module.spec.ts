import { Test } from '@nestjs/testing';
import { setUpConfig } from '../../config/configure';
import { MailModule } from './mail.module';
import { mailProviders } from './providers/mail.providers';
import { MailService } from './services/mail.service';

describe('MailModule', () => {
  let mailModule;
  let mailService: MailService;

  setUpConfig();

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      modules: [
        MailModule,
      ],
    }).compile();

    mailModule = module.select<MailModule>(MailModule);
    mailService = module.get<MailService>(MailService);

  });

  it('should create a module', () => {
    expect(mailModule).toBeDefined();
    expect(mailService).toBeDefined();
  });
});