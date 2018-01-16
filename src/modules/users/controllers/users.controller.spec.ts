import { Test } from '@nestjs/testing';
import { TestingModule } from '@nestjs/testing/testing-module';
import { setUpConfig } from '../../../config/configure';

import { DatabaseModule } from '../../database/database.module';
import { AuthModule } from '../../auth/auth.module';
import { MailModule } from '../../mail/mail.module';

import { NotFoundException } from '../../common/exceptions/notFound.exception';
import { SignUpUserDto } from '../dto/sign-up.dto';
import { LogInCredentialsDto } from '../dto/log-in-credentials.dto';
import { userProviders } from './../providers/users.providers';
import { UsersService } from '../services/users.service';
import { UsersController} from './users.controller';
import { AuthService, IaccessTokenData } from '../../auth/services/auth.service';
import { VerificationService } from '../services/verification.service';
import { AvailabilityService } from '../services/availability.service';

describe('UsersController', () => {
  const userMock: SignUpUserDto = {
    name: 'kek',
    email: 'kek@2k2.com',
    password: '1333d',
    description: '34',
  };
  const dbUserMock = {
    id: 34234,
    email: userMock.email,
    roles: JSON.stringify(['user']),
  };
  let testingModule: TestingModule;
  let usersController: UsersController;
  let usersService: UsersService;
  let verificationService: VerificationService;
  let availabilityService: AvailabilityService;
  let authService: AuthService;

  setUpConfig();

  beforeAll(async () => {
    testingModule = await Test.createTestingModule({
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
  });

  beforeEach(() => {
    const authModule = testingModule.select<AuthModule>(AuthModule);

    authService = authModule.get<AuthService>(AuthService);
    usersController = testingModule.get<UsersController>(UsersController);
    usersService = testingModule.get<UsersService>(UsersService);
    verificationService = testingModule.get<VerificationService>(VerificationService);
    availabilityService = testingModule.get<AvailabilityService>(AvailabilityService);
  });

  describe('verifyUser', () => {
    it('should call appropriate services', async () => {
      const hash = '42343so23423rrandom';
      const id = '3';

      // spies
      const updateStatusMock = jest
        .spyOn(usersService, 'updateUser')
        .mockImplementation(() => {});
      const verifyMock = jest.fn((hashdata) => id);
      const deleteMock = jest.fn(() => {});
      verificationService.verify = verifyMock;
      verificationService.deleteHash = deleteMock;

      await usersController.verifyUser({ hash });

      expect(updateStatusMock).toBeCalledWith(id, { isActive: true });
      expect(verifyMock).toBeCalledWith(hash);
      expect(deleteMock).toBeCalledWith(hash);
    });
  });

  describe('signUp', () => {
    it('should call appropriate services', async () => {
      const hashMock = 'wrwerr23r2';

      // spies
      const testMock = jest
        .spyOn(availabilityService, 'test')
        .mockImplementation(() => {});
      const signUpMock = jest
        .spyOn(usersService, 'signUp')
        .mockImplementation(() => dbUserMock);
      const verificationMock = jest
        .spyOn(verificationService, 'sendVerificationEmail')
        .mockImplementation(() => ({ hash: hashMock }));

      const { hash } = await usersController.signUp(userMock) as { hash: string };

      expect(hash).toBe(hashMock);
      expect(availabilityService.test).toBeCalled();
      expect(signUpMock).toBeCalledWith(userMock);
      expect(verificationService.sendVerificationEmail).toBeCalled();
    });

    it('shouldn\'t return hash when in env other than test', async () => {
      process.env.NODE_ENV = 'production';

      const hashMock = 'wrwerr23r2';

      // spies
      const testMock = jest
        .spyOn(availabilityService, 'test')
        .mockImplementation(() => {});
      const signUpMock = jest
        .spyOn(usersService, 'signUp')
        .mockImplementation(() => dbUserMock);
      const verificationMock = jest
        .spyOn(verificationService, 'sendVerificationEmail')
        .mockImplementation(() => ({ hash: hashMock }));

      const reply = await usersController.signUp(userMock);

      expect(reply).toBeUndefined();

      process.env.NODE_ENV = 'test';

    });
  });

  describe('logIn', () => {
    it('should call appropriate services', async () => {
      const credetentialsMock: LogInCredentialsDto = {
        email: userMock.email,
        password: userMock.password,
      };
      const tokenData: IaccessTokenData = {
        roles: dbUserMock.roles,
        id: dbUserMock.id,
      };
      const accessTokenMock: string = '2321312312';
      const refreshTokenMock: string = '1232342355';

      // spies
      const logInMock = jest
        .spyOn(usersService, 'logIn')
        .mockImplementation(() => dbUserMock);
      const createAccessTokenMock = jest.fn(() => accessTokenMock);
      const createRefreshTokenMock = jest.fn(() => refreshTokenMock);
      authService.createAccessToken = createAccessTokenMock;
      authService.createRefreshToken = createRefreshTokenMock;

      const response = await usersController.logIn(credetentialsMock);

      expect(logInMock).toBeCalledWith(credetentialsMock);
      expect(createAccessTokenMock).toBeCalledWith(tokenData);
      expect(createRefreshTokenMock).toBeCalledWith(tokenData);

      expect(response).toBeDefined();
      expect(response.data).toEqual({
        user: dbUserMock,
      });
      expect(response.meta).toEqual({
        accessToken: accessTokenMock,
        refreshToken: refreshTokenMock,
      });
    });
  });

  describe('logOut', () => {
    it('should call appropriate service', async () => {
      const request = {
        user: { id: 3 },
      };
      const headers = {
        'x-refresh': 'mockk',
      };

      const revokeMock = jest
        .spyOn(authService, 'revokeRefreshToken')
        .mockImplementation(() => {});

      await usersController.logOut(request, headers);

      expect(revokeMock).toBeCalled();
      expect(revokeMock).toBeCalledWith({
        id: request.user.id,
        refreshToken: headers['x-refresh'],
      });
    });
  });

  describe('logOutAll', () => {
    it('should call appropriate service', async () => {
      const request = {
        user: { id: 3 },
      };

      const revokeAllMock = jest
        .spyOn(authService, 'revokeAllRefreshTokens')
        .mockImplementation(() => {});

      await usersController.logOutAll(request);

      expect(revokeAllMock).toBeCalledWith(request.user.id);
    });
  });

});