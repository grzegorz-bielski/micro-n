import { Interceptor, NestInterceptor, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

@Interceptor()
export class SanitizationInterceptor implements NestInterceptor {
  public intercept(request, context: ExecutionContext, stream$: Observable<any>): Observable<any> {
    return stream$.map(
      (response) => {
        if (Array.isArray(response.data)) {
          response.data = response.data.map(this.sanitizePost);
        } else if (typeof response === 'object'){
          response.data = this.sanitizePost(response.data);
        }

        return response;
      },
    );
  }
  private sanitizePost(post) {
    const sanitizedUser = Object.assign({}, post.user);

    // remove password
    delete sanitizedUser.password;

    return Object.assign(post, { user: sanitizedUser });
  }
}