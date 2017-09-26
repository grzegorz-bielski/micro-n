import { Middleware, NestMiddleware, ExpressMiddleware } from '@nestjs/common';

@Middleware()
export class LoggerMiddleware implements NestMiddleware {
  resolve(controllerName: string): ExpressMiddleware {
    return (req, res, next) => {
      console.log('Request to the ' + controllerName);
      next();
    };
  }
}
