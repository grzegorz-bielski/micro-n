import { Middleware, NestMiddleware, ExpressMiddleware } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { UnauthorizedException } from '../../common/exceptions/unauthorized.exception';
import { IaccessTokenData } from './../services/auth.service';

export interface IparsedData {
  roles: string[];
  id: number;
}

@Middleware()
export class AuthMiddleware implements NestMiddleware {
  public resolve(): ExpressMiddleware {
    return async (request, response, next) => {
      const token: string = request.header('x-auth');
      let data: IparsedData;

      // set request data
      try {
        data = token ? await this.verify(token) as IparsedData : { roles: ['guest'], id: null };
      } catch (error) {
        throw new UnauthorizedException(error);
      }

      // attach data to request
      request.user = request.user ? Object.assign(request.user, data) : data;

      // then let `RolesGuard` check if given roles will be sufficient to access particular route
      next();
    };
  }

  public verify(token: string) {
    return new Promise((resolve, reject) => {
      jwt.verify(token, process.env.JWT_SECRET, (error, decoded: IaccessTokenData) => {
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
