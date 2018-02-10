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
  // strip off all private data
  private sanitize(data) {
    // 1. user data
    const { id, name, roles, isActive } = Object.assign({}, data.user);
    const sanitizedData = Object.assign(data, { user: { id, name, roles, isActive } });

    // 2. post/comment data
    if (sanitizedData.image && sanitizedData.image.image) {
      delete sanitizedData.image.image;
    }

    // 3. check recursively other fields

    // comments field
    if (data.comments) {
      sanitizedData.comments = [...data.comments.map(this.sanitize)];
    }
    // posts field
    if (data.posts) {
      sanitizedData.posts = [...data.comments.map(this.sanitize)];
    }

    return sanitizedData;
  }
}