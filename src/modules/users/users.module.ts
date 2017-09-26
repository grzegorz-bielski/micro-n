import { Module, NestModule } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { UsersController } from './users.controller';
import { userProviders } from './users.providers';
import { UsersService } from './users.service';

@Module({
    modules: [DatabaseModule],
    controllers: [UsersController],
    components: [
        ...userProviders,
        UsersService,
    ],
})
export class UsersModule {}
