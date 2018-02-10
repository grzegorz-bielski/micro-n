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

    const excludedPaths = ['/auth/token'];

    consumer
        .apply(AuthMiddleware)
        .with(excludedPaths)
        .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
