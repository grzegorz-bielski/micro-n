import { Interceptor, NestInterceptor, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

@Interceptor()
export class SanitizationInterceptor implements NestInterceptor {
  public intercept(request, context: ExecutionContext, stream$: Observable<any>): Observable<any> {
    return stream$.map(
      (response) => {
        if (response && Array.isArray(response.data)) {
          response.data = response.data.map(this.sanitize);
        } else if (typeof response === 'object'){
          response.data = this.sanitize(response.data);
        }

        return response;
      },
    );
  }
  private sanitize(post) {
    // user
    const { id, name, roles, isActive } = Object.assign({}, post.user);

    // post
    const sanitizedPost = Object.assign(post, { user: { id, name, roles, isActive } });
    if (sanitizedPost.image) {
      delete sanitizedPost.image.image;
    }

    return sanitizedPost;
  }
}