import { Interceptor, NestInterceptor, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

// for use with Posts and Comments routes

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
  private sanitize(postOrComment) {
    // user
    const { id, name, roles, isActive } = Object.assign({}, postOrComment.user);
    const sanitizedPostOrComment = Object.assign(postOrComment, { user: { id, name, roles, isActive } });

    // post or comment
    if (sanitizedPostOrComment.image && sanitizedPostOrComment.image.image) {
      delete sanitizedPostOrComment.image.image;
    }
    // comments of post(s)
    if (postOrComment.comments) {
      sanitizedPostOrComment.comments = [...postOrComment.comments.map(this.sanitize)];
    }

    return sanitizedPostOrComment;
  }
}