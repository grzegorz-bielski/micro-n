import { Interceptor, NestInterceptor, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs/Observable';
import * as express from 'express';
import 'rxjs/add/operator/map';

@Interceptor()
export class TokenInterceptor implements NestInterceptor {
  public intercept(request, context: ExecutionContext, stream$: Observable<any>): Observable<any> {
    return stream$.map(
      (response) => {
        // if token was auto-refreshed then add it to meta info
        const newAccessToken = request.user.newAccessToken;
        if (!newAccessToken) {
          return response;
        }
        const meta = Object.assign({}, response.meta);
        meta.newAccessToken = newAccessToken;

        return Object.assign(response, { meta });
      },
    );
  }
}