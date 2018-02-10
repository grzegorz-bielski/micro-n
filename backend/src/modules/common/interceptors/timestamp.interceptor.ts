import { Interceptor, NestInterceptor, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/do';

export class TimestampInterceptor implements NestInterceptor {
  intercept(data, context: ExecutionContext, stream$: Observable<any>): Observable<any> {
    const now = Date.now();

    return stream$.do(
      () => console.log(`Finished: ${Date.now() - now}ms`),
    );
  }
}