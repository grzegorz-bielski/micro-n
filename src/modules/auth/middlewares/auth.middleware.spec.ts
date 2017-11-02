import { Test } from '@nestjs/testing';
import { setUpConfig } from '../../../config/configure';
import { AuthMiddleware } from './auth.middleware';
import { AuthService } from '../services/auth.service';
import { DatabaseModule } from '../../database/database.module';
import { UnauthorizedException } from '../../common/exceptions/unauthorized.exception';

jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000000;

describe('AuthMiddleware', () => {
  // const authService: AuthService =  new AuthService();
  const excludedPaths: string[] = [
    '/auth/token', '/kek/none',
  ];
  let authMiddleware: AuthMiddleware;
  let authService: AuthService;

  setUpConfig();

  beforeAll(async () => {
    // authMiddleware = new AuthMiddleware(authService);
    const module = await Test.createTestingModule({
      modules: [
        DatabaseModule,
      ],
      components: [
        AuthService,
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    authMiddleware = new AuthMiddleware(authService);
  });

  it('should return a function in resolve method', () => {
    const fun = authMiddleware.resolve(excludedPaths);

    expect(typeof fun).toBe('function');
  });

  it('should call next function', async () => {
    const fun = authMiddleware.resolve(excludedPaths);
    const request = {
      header: jest.fn(headerType => null),
    };
    const next = jest.fn();

    await fun(request, {}, next);

    expect(request.header).toBeCalled();
    expect(request.header).toBeCalledWith('x-auth');
    expect(next).toBeCalled();
  });

  it('should omit excluded path', async () => {
    const fun = authMiddleware.resolve(excludedPaths);
    const request = {
      path: excludedPaths[1],
      header: jest.fn(headerType => null),
    };
    const next = jest.fn();

    await fun(request, {}, next);

    expect(request.header).not.toBeCalled();
    expect(next).toBeCalled();

  });

  it('should set role to guest if there is no token', async () => {
    const fun = authMiddleware.resolve(excludedPaths);
    const request = {
      header: jest.fn(headerType => null),
      user: {
        roles: null,
        id: null,
      },
    };
    const next = () => {};

    await fun(request, {}, next);

    expect(request.header).toBeCalled();
    expect(request.header).toBeCalledWith('x-auth');
    expect(request.user.roles).toContain('guest');
    expect(request.user.id).toBe(null);
  });

  it('should set roles if valid token is given', async () => {
    const fun = authMiddleware.resolve(excludedPaths);
    const createToken = {
      id: 3,
      roles: JSON.stringify(['user']),
    };
    const token = await authService.createAccessToken(createToken);
    const request = {
      header: jest.fn(headerType => token),
      user: {
        roles: null,
        id: null,
      },
    };
    const next = () => {};

    await fun(request, {}, next);

    expect(request.header).toBeCalled();
    expect(request.header).toBeCalledWith('x-auth');
    expect(request.user.roles).toEqual(JSON.parse(createToken.roles));
    expect(request.user.id).toBe(createToken.id);

  });

  it('should throw verification error if token is invalid', async () => {
    const fun = authMiddleware.resolve(excludedPaths);
    const createToken = {
      id: 3,
      roles: JSON.stringify(['user']),
    };
    const token = 'some-invalid-token';
    const request = {
      header: jest.fn(headerType => token),
      user: {
        roles: null,
        id: null,
      },
    };
    const next = () => {};

    try {
      await fun(request, {}, next);
    } catch (error) {
      expect(error).toBeInstanceOf(UnauthorizedException);
    }

  });

  it('shouldn\'t throw verification error for expired token if valid access token is provided', async () => {
    const fun = authMiddleware.resolve(excludedPaths);
    const createToken = {
      id: 3,
      roles: JSON.stringify(['user']),
    };
    const accessToken = await authService.createAccessToken(createToken, { expiresIn: '0s' });
    const refreshToken = await authService.createRefreshToken(createToken);
    const request = {
      header: jest.fn(headerType => {
        if (headerType === 'x-auth') {
          return accessToken;
        } else if (headerType === 'x-refresh') {
          return refreshToken;
        }
      }),
      user: {
        roles: null,
        id: null,
      },
    };
    const next = () => {};

    await fun(request, {}, next);

    expect(request.header).toBeCalled();
    expect(request.header).toBeCalledWith('x-auth');
    expect(request.user.roles).toEqual(JSON.parse(createToken.roles));
    expect(request.user.id).toBe(createToken.id);
  });

  it('should throw verification error for expired token if invalid access token is provided', async () => {
    const fun = authMiddleware.resolve(excludedPaths);
    const createToken = {
      id: 3,
      roles: JSON.stringify(['user']),
    };
    const accessToken = 'wefwefwefwesaxcxzq';
    const refreshToken = await authService.createRefreshToken(createToken);
    const request = {
      header: jest.fn(headerType => {
        if (headerType === 'x-auth') {
          return accessToken;
        } else if (headerType === 'x-refresh') {
          return refreshToken;
        }
      }),
      user: {
        roles: null,
        id: null,
      },
    };
    const next = () => {};

    await expect(fun(request, {}, next)).rejects.toBeDefined();

    expect(request.header).toBeCalled();
    expect(request.header).toBeCalledWith('x-auth');
    expect(request.user.roles).toBeNull();
    expect(request.user.id).toBeNull();
  });
});
