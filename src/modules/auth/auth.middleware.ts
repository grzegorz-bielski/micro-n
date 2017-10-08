import { Middleware, NestMiddleware, ExpressMiddleware } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { UnauthorizedException } from '../common/exceptions/unauthorized.exception';

@Middleware()
export class AuthMiddleware implements NestMiddleware {
  public resolve(): ExpressMiddleware {
    return (request, response, next) => {
      const token = request.header('x-auth');

      if (!token) {
        // if there is no token set role to guest and id to null
        request.user = {
          roles: ['guest'],
          id: null,
        };
      } else {
        // if there is token then verify it and set roles based on `decoded.roles`

        // todo: resfresh tokens
        jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
          if (error) {
            throw new UnauthorizedException(error);
          } else {
            request.user = {
              roles: JSON.parse(decoded.roles),
              id: decoded.id,
            };
          }
        });
      }
      // then let `RolesGuard` check if given roles will be sufficient to access particular route
      console.log('auth roles: ', request.user);
      next();
    };
  }
}
