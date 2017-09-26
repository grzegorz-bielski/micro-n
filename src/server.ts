import './config/config';

import { NestFactory } from '@nestjs/core';
import { INestApplication } from '@nestjs/common';
import { ApplicationModule } from './modules/app.module';
import { ValidationPipe } from './modules/common/pipes/validation.pipe';
import { TimestampInterceptor } from './modules/common/interceptors/timestamp.interceptor';
import { HttpExceptionFilter } from './modules/common/filters/httpException.filter';
// import { notFoundMiddleware } from './modules/common/middlewares/notFound.middleware';

import * as compression from 'compression';
import * as bodyParser from 'body-parser';
import * as helmet from 'helmet';

async function bootstrap() {
  const app: INestApplication = await NestFactory.create(ApplicationModule);

  // express middleware
  app.use(helmet());
  app.use(bodyParser.json());
  app.use(compression());
  // app.use(notFoundMiddleware);

  // nest global config
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TimestampInterceptor());

  await app.listen(3000);
}

bootstrap();
