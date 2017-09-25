import { NestFactory } from '@nestjs/core';
import { ApplicationModule } from './modules/app.module';
import { ValidationPipe } from './modules/common/pipes/validation.pipe';

import * as compression from 'compression';
import * as bodyParser from 'body-parser';
import * as helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(ApplicationModule);
  app.use(helmet());
  app.use(bodyParser.json());
  app.use(compression());
  app.useGlobalPipes(new ValidationPipe());

  await app.listen(3000);
}
bootstrap();
