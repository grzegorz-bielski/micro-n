import * as http from 'http';
import * as compression from 'compression';
import * as bodyParser from 'body-parser';
import * as helmet from 'helmet';
import * as express from 'express';
import * as path from 'path';
import { NestFactory } from '@nestjs/core';
import { INestApplication } from '@nestjs/common';

import { setUpConfig } from './config/configure';
import { ApplicationModule } from './modules/app.module';
import { ValidationPipe } from './modules/common/pipes/validation.pipe';
import { TokenInterceptor } from './modules/auth/interceptors/token.interceptor';
import { TimestampInterceptor } from './modules/common/interceptors/timestamp.interceptor';
import { HttpExceptionFilter } from './modules/common/filters/httpException.filter';

setUpConfig();

const port = Number.parseInt(process.env.PORT);

export const configureApp = (app: INestApplication): INestApplication => {
  // express config
  app.use(helmet());
  app.use(bodyParser.json({ limit: '5mb' }));
  app.use(compression());
  app.use(express.static(path.resolve(__dirname, './public')));

  // nest global config
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TimestampInterceptor());
  app.useGlobalInterceptors(new TokenInterceptor());

  return app;
};

// start server

(async () => {
  if (process.env.NODE_ENV !== 'test') {
    await configureApp(await NestFactory.create(ApplicationModule))
      .listen(port, () => console.log(`App started at port: ${port}`));
  }
})();
