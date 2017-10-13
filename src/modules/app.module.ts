import { Module, NestModule, MiddlewaresConsumer, RequestMethod } from '@nestjs/common';
import { LoggerMiddleware } from './common/middlewares/logger.middleware';
import { UsersModule } from './users/users.module';
import { UsersController } from './users/controllers/users.controller';

@Module({
    modules: [
        UsersModule,
    ],
})
export class ApplicationModule implements NestModule {
    configure(consumer: MiddlewaresConsumer): void {
        consumer
            .apply(LoggerMiddleware)
            .with('UsersController')
            .forRoutes(UsersController);
    }
}
