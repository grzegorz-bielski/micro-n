import { Module, NestModule, MiddlewaresConsumer, RequestMethod } from '@nestjs/common';
import { LoggerMiddleware } from './common/middlewares/logger.middleware';
import { AuthMiddleware } from './common/middlewares/auth.middleware';
import { UsersModule } from './users/users.module';
import { UsersController } from './users/users.controller';

@Module({
    modules: [ UsersModule ],
})
export class ApplicationModule implements NestModule {
    configure(consumer: MiddlewaresConsumer): void {
        consumer
            .apply(LoggerMiddleware)
            .with('UsersController')
            .forRoutes(UsersController)

            .apply(AuthMiddleware)
            .forRoutes({ path: '/*', method: RequestMethod.ALL });
    }
}
