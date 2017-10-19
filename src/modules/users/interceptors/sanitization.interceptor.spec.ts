import * as Rx from 'rxjs';
import 'rxjs/add/observable/of';
import { SanitizationInterceptor } from './sanitization.interceptor';

describe('SanitizationInterceptor', () => {
  const mockUser = {
    email: 'kek@exampl.com',
    password: '123',
  };

  describe('intercept', () => {
    it('returns sanitized data', () => {
      const mockData = {
        accessToken: '331231231',
        refreshToken: '3213131',
        user: mockUser,
      };
      const data$ = Rx.Observable.of(mockData);

      const interceptor = new SanitizationInterceptor();
      const sanitizationObservable = interceptor.intercept(null, null, data$);
      sanitizationObservable.subscribe(
        ({ user, accessToken, refreshToken }) => {
          expect(accessToken).toBe(mockData.accessToken);
          expect(refreshToken).toBe(mockData.refreshToken);

          expect(user.password).toBeUndefined();
        },
      );

    });
  });
});