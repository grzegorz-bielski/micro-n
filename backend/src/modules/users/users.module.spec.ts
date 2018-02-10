import 'jest';
import { Test } from '@nestjs/testing';
import { setUpConfig } from '../../config/configure';

// modules
import { UsersModule } from './users.module';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../mail/mail.module';

// components
import { userProviders } from './providers/users.providers';
import { UsersService } from './services/users.service';
import { AvailabilityService } from './services/availability.service';
import { VerificationService } from './services/verification.service';
import { UsersController } from './controllers/users.controller';

jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000000;

describe('UsersModule', () => {
  let usersService: UsersService;
  let availabilityService: AvailabilityService;
  let verificationService: VerificationService;

  setUpConfig();

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      modules: [
        UsersModule,
      ],
    }).compile();

    const usersModule = module.select<UsersModule>(UsersModule);
    verificationService = usersModule.get<VerificationService>(VerificationService);
    availabilityService = usersModule.get<AvailabilityService>(AvailabilityService);
    usersService = usersModule.get<UsersService>(UsersService);
  });

  it('should create module', async () => {
    expect(usersService).toBeDefined();
    expect(availabilityService).toBeDefined();
    expect(verificationService).toBeDefined();
  });
});