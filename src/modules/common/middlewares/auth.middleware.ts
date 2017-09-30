import { Middleware, NestMiddleware, ExpressMiddleware } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { UnauthorizedException } from '../exceptions/unauthorized.exception';

@Middleware()
export class AuthMiddleware implements NestMiddleware {
  public resolve(): ExpressMiddleware {
    return (request, response, next) => {
      const token = request.header('x-auth');
      if (!token) {
        request.roles = ['guest'];
        return next();
      }

      jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
        if (error) {
          throw new UnauthorizedException(error);
        } else {
          request.roles = JSON.parse(decoded.roles);
          console.log('auth roles: ', request.roles);
          next();
        }

      });
    };
  }
}
