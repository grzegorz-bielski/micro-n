import { Interceptor, NestInterceptor, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

@Interceptor()
export class SanitizationInterceptor implements NestInterceptor {
  intercept(dataOrRequest, context: ExecutionContext, stream$: Observable<any>): Observable<any> {
    return stream$.map(
      (data) => {
        const { accessToken, refreshToken, user } = data;
        const sanitizedUser = Object.assign({}, user);
        delete sanitizedUser.password;

        return {
          accessToken,
          refreshToken,
          user: sanitizedUser,
        };
      },
    );
  }
}
