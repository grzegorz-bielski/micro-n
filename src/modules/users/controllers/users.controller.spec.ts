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
  let usersService: UsersService;
  let verificationService: VerificationService;
  let availabilityService: AvailabilityService;

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
    usersService = module.get<UsersService>(UsersService);
    verificationService = module.get<VerificationService>(VerificationService);
    availabilityService = module.get<AvailabilityService>(AvailabilityService);
  });

  describe('verifyUser', () => {
    it('should call appropriate services', async () => {
      // const hash = '42343so23423rrandom';
      // const id = '3';
      // const updateStatusMock = jest
      //   .spyOn(usersService, 'updateStatus');
      // const verifyMock = jest
      //   .spyOn(verificationService, 'verify')
      //   .mockImplementation((hashdata) => id);
      // const deleteHashMock = jest
      //   .spyOn(verificationService, 'deleteHash');

      // try {
      //   const response = await usersController.verifyUser({ hash });

      //   // response is just a stub for now, so there no specific tests for it for now
      //   expect(response).toBeDefined();
      //   expect(verifyMock).toBeCalledWith(hash);
      //   expect(updateStatusMock).toBeCalledWith(id, true);
      //   expect(deleteHashMock).toBeCalledWith(hash);
      // } catch (error) {
      //   console.log(error);
      // }
    });
  });

  // describe('signUp', () => {
  //   ///
  // });

  // describe('logIn', () => {
  //   //
  // });

  // describe('logOut', () => {
  //   //
  // });

  // describe('logOutAll', () => {
  //   //
  // });

});