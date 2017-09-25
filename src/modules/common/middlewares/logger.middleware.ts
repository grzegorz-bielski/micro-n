import { Middleware, NestMiddleware, ExpressMiddleware } from '@nestjs/common';

@Middleware()
export class LoggerMiddleware implements NestMiddleware {
  resolve(route: string): ExpressMiddleware {
    return (req, res, next) => {
      console.log('Request to the ' + route);
      next();
    };
  }
}
