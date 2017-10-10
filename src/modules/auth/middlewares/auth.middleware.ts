import { Middleware, NestMiddleware, ExpressMiddleware } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { UnauthorizedException } from '../../common/exceptions/unauthorized.exception';
import { IcreateToken } from './../services/auth.service';

@Middleware()
export class AuthMiddleware implements NestMiddleware {
  public resolve(): ExpressMiddleware {
    return async (request, response, next) => {
      const token: string = request.header('x-auth');
      let data: object;

      // set request data
      try {
        data = token ? await this.verify(token) : { roles: ['guest'], id: null };
      } catch (error) {
        throw new UnauthorizedException(error);
      }

      // attach data to request
      request.user = request.user ? Object.assign(request.user, data) : data;

      // then let `RolesGuard` check if given roles will be sufficient to access particular route
      next();
    };
  }

  private verify(token: string) {
    return new Promise((resolve, reject) => {
      jwt.verify(token, process.env.JWT_SECRET, (error, decoded: IcreateToken) => {
        if (error || !decoded) {
          reject(error);
        } else {
          resolve({
            roles: JSON.parse(decoded.roles),
            id: decoded.id,
          });
        }
      });
    });
  }
}
