import { AuthController } from './auth.controller';
import { AuthService, IrefershTokenRedis } from './../services/auth.service';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  const userId = '4';
  const refreshTokens: IrefershTokenRedis[] = [
    {
      token: `f34mfkl43mfm43f43mkfm4ghlfckl3`,
      roles: JSON.stringify(['user']),
      created: Date.now(),
    },
    {
      token: `f34mfkl43mfm43f43rtgm43klfckl3`,
      roles: JSON.stringify(['user']),
      created: Date.now(),
    },
    {
      token: `f34mfk3rjmfm43f43mkfm43klfckl3`,
      roles: JSON.stringify(['user']),
      created: Date.now(),
    },

  ];

  beforeAll( () => {
    authService = new AuthService(null);
    authController = new AuthController(authService);
  });

  describe('POST /token', () => {
    it('should return new access token', async () => {
      const body = {
        id: Number.parseInt(userId),
        refreshToken: refreshTokens[0].token,
      };
      const mockResponse = {
        accessToken: '34f34ferergerggre3434433434g3g5gkdfmffddssbgsbjmm',
      };

      const authMock = jest
        .spyOn(authService, 'refreshAccessToken')
        .mockImplementation(data => mockResponse.accessToken);

      const response = await authController.getToken(body);

      expect(response).toEqual(mockResponse);
      expect(typeof response.accessToken).toBe('string');
      expect(authMock).toBeCalled();
      expect(authMock).toBeCalledWith(body);

    });
  });

  describe('GET /token/all/:id', () => {
    it('should return an array of tokens for user id', async () => {
      const params = { id: userId };
      const authMock = jest
        .spyOn(authService, 'getAllRefreshTokens')
        .mockImplementation((id: number) => refreshTokens);

      const tokens = await authController.getAllTokens(params);

      expect(tokens).toBe(refreshTokens);
      expect(authMock).toBeCalled();
      expect(authMock).toBeCalledWith(Number.parseInt(params.id));
    });
  });

  describe('DELETE /token/revoke', () => {
    it('should call a proper service method with arguments', async () => {
      const body = {
        id: Number.parseInt(userId),
        refreshToken: refreshTokens[0].token,
      };

      const createRefreshTokenMock = jest.spyOn(authService, 'revokeRefreshToken');

      await authController.revokeToken(body);

      expect(createRefreshTokenMock).toHaveBeenCalledTimes(1);
      expect(createRefreshTokenMock).toBeCalledWith(body);
    });
  });
});