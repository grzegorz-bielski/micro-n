import { Module, NestModule, MiddlewaresConsumer, RequestMethod } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { AuthMiddleware } from './middlewares/auth.middleware';

@Module({
    modules: [
      DatabaseModule,
    ],
    controllers: [
      AuthController,
    ],
    components: [
      AuthService,
    ],
    exports: [
      AuthService,
    ],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewaresConsumer): void {

    consumer
        .apply(AuthMiddleware)
        .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
