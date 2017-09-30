import { Module, NestModule } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { UsersController } from './users.controller';
import { userProviders } from './users.providers';
import { UsersService } from './services/users.service';
import { AvailabilityService } from './services/availability.service';

@Module({
    modules: [DatabaseModule],
    controllers: [UsersController],
    components: [
        ...userProviders,
        AvailabilityService,
        UsersService,
    ],
})
export class UsersModule {}
