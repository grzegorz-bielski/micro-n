import { Module, NestModule } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { UsersController } from './users.controller';
import { userProviders } from './users.providers';
import { UsersService } from './services/users.service';
import { AvailabilityService } from './services/availability.service';

@Module({
    modules: [ DatabaseModule, AuthModule ],
    controllers: [ UsersController ],
    components: [
        ...userProviders,
        AvailabilityService,
        UsersService,
    ],
})
export class UsersModule {}
