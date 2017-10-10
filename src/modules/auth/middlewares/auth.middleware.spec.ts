import { setUpConfig } from '../../../config/configure';
import { AuthMiddleware } from './auth.middleware';
import { AuthService } from '../services/auth.service';
import { UnauthorizedException } from '../../common/exceptions/unauthorized.exception';

describe('AuthMiddleware', () => {
  const authService: AuthService =  new AuthService(null);
  let authMiddleware: AuthMiddleware;

  // const token = authService.createAccessToken({ id: userid, roles: })

  setUpConfig();

  beforeEach(() => {
    authMiddleware = new AuthMiddleware();
  });

  it('should return a function in resolve method', () => {
    const fun = authMiddleware.resolve();

    expect(typeof fun).toBe('function');
  });

  it('should call next function', async () => {
    const fun = authMiddleware.resolve();
    const request = {
      header: jest.fn(headerType => null),
    };
    const next = jest.fn();

    await fun(request, {}, next);

    expect(request.header).toBeCalled();
    expect(request.header).toBeCalledWith('x-auth');
    expect(next).toBeCalled();
  });

  it('should set role to guest if there is no token', async () => {
    const fun = authMiddleware.resolve();
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
    const fun = authMiddleware.resolve();
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
    const fun = authMiddleware.resolve();
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

    expect(request.header).toBeCalled();
    expect(request.header).toBeCalledWith('x-auth');

  });

  it('should throw verification error if token has expired', async () => {
  //   const fun = authMiddleware.resolve();
  //   const createToken = {
  //     id: 3,
  //     roles: JSON.stringify(['user']),
  //   };
  //   const token = await authService.createAccessToken(createToken, { expiresIn: });
  //   const request = {
  //     header: jest.fn(headerType => token),
  //     user: {
  //       roles: null,
  //       id: null,
  //     },
  //   };
  //   const next = () => {};
  });
});
