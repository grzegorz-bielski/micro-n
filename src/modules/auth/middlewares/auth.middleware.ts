import { Middleware, NestMiddleware, ExpressMiddleware } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { promisify } from 'util';

import { UnauthorizedException } from '../../common/exceptions/unauthorized.exception';
import { AuthService, IaccessTokenData } from './../services/auth.service';

export interface IparsedData {
  roles: string[];
  id?: number;
  newAccessToken?: string;
}

const verifyAsync = promisify(jwt.verify);
const decodeAsync = promisify(jwt.decode);

@Middleware()
export class AuthMiddleware implements NestMiddleware {
  private readonly autoRefresh: boolean = true;

  constructor(
    private readonly authService: AuthService,
  ) {}

  public resolve(excludedPaths: string[]): ExpressMiddleware {
    return async (request, response, next) => {
      if (!excludedPaths.find(path => path === request.path)) {
        const accessToken: string = request.header('x-auth');
        const refreshToken: string = request.header('x-refresh');
        const data: IparsedData = accessToken ? await this.decodeData(accessToken, refreshToken) : { roles: ['guest'] };

        // attach data to request
        request.user = request.user ? Object.assign(request.user, data) : data;
      }
      // then let `RolesGuard` check if given roles will be sufficient to access particular route
      next();
    };
  }

  public async decodeData(accessToken: string, refreshToken: string) {
    let newAccessToken: string;
    let decoded: IaccessTokenData;
    try {
      // verify and decode
      decoded = await verifyAsync(accessToken,  process.env.JWT_SECRET) as IaccessTokenData;
    } catch (error) {
      if (error.name === 'TokenExpiredError' && refreshToken && this.autoRefresh) {
        // if token has expired try to refresh it
        decoded = jwt.decode(accessToken) as IaccessTokenData;
        newAccessToken = await this.authService.refreshAccessToken({ refreshToken, id: decoded.id });
      } else {
        throw new UnauthorizedException(error);
      }

    }
    return {
      roles: JSON.parse(decoded.roles),
      id: decoded.id,
      newAccessToken,
    };
  }

}
