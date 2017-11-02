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
        data: {
          user: mockUser,
        },
        meta: {
          accessToken: '331231231',
          refreshToken: '3213131',
        },
      };
      const data$ = Rx.Observable.of(mockData);

      const interceptor = new SanitizationInterceptor();
      const sanitizationObservable = interceptor.intercept(null, null, data$);
      sanitizationObservable.subscribe(
        ({ data, meta }) => {
          expect(meta.accessToken).toBe(mockData.meta.accessToken);
          expect(meta.refreshToken).toBe(mockData.meta.refreshToken);

          expect(data.user.password).toBeUndefined();
        },
      );

    });
  });
});