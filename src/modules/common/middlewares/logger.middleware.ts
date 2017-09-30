import { Middleware, NestMiddleware, ExpressMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Middleware()
export class LoggerMiddleware implements NestMiddleware {
  resolve(controllerName: string): ExpressMiddleware {
    return (req: Request, res: Response, next: NextFunction) => {
      const path = req.route.path;

      if (path.match(/^(.+)\/\*$/)) {
        console.log(`Also matched by /* handler`);
        next();
        return;
      }

      console.log(`
        ---
        Request to the: ${controllerName}
        Path: ${path}
        IP: ${req.ip}
        ---
      `);
      next();
    };
  }
}
