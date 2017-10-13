import { Test } from '@nestjs/testing';
import { setUpConfig } from '../../../config/configure';

import { DatabaseModule } from '../../database/database.module';
import { AuthModule } from '../../auth/auth.module';
import { MailModule } from '../../mail/mail.module';

import { userProviders } from './../providers/users.providers';
import { UsersService } from '../services/users.service';
import { UsersController } from './users.controller';
import { AuthService} from '../../auth/services/auth.service';
import { VerificationService } from '../services/verification.service';
import { AvailabilityService } from '../services/availability.service';

describe('UsersModule', () => {
  let usersController: UsersController;

  setUpConfig();

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      modules: [
        DatabaseModule,
        AuthModule,
        MailModule,
    ],
    controllers: [
        UsersController,
    ],
    components: [
        ...userProviders,
        AvailabilityService,
        VerificationService,
        UsersService,
    ],
    }).compile();

    usersController = module.get<UsersController>(UsersController);
  });

  describe('verifyUser', () => {
    //
  });

  describe('signUp', () => {
    ///
  });

  describe('logIn', () => {
    //
  });

  describe('logOut', () => {
    //
  });

  describe('logOutAll', () => {
    //
  });

});