import { Interceptor, NestInterceptor, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

// for use with User only

@Interceptor()
export class SanitizationInterceptor implements NestInterceptor {
  intercept(dataOrRequest, context: ExecutionContext, stream$: Observable<any>): Observable<any> {
    return stream$.map(
      (responseData) => {
        const sanitizedData = Object.assign({}, responseData);

        // sanitization
        delete sanitizedData.data.user.password;

        return sanitizedData;
      },
    );
  }
}
