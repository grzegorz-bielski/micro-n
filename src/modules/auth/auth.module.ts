import { Module, NestModule, MiddlewaresConsumer, RequestMethod } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthMiddleware } from './auth.middleware';

@Module({
    controllers: [ AuthController ],
    components: [ AuthService ],
    exports: [ AuthService ],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewaresConsumer): void {

    consumer
        .apply(AuthMiddleware)
        .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
