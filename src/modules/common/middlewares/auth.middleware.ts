import { Middleware, NestMiddleware, ExpressMiddleware } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { UnauthorizedException } from '../exceptions/unauthorized.exception';

@Middleware()
export class AuthMiddleware implements NestMiddleware {
  public resolve(): ExpressMiddleware {
    return (req, res, next) => {
      const token = req.header('x-auth');

      jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
        if (error) {
          throw new UnauthorizedException(error);
        } else {
          // find by id? -> decoded.id
          next();
        }

      });
    };
  }
}
