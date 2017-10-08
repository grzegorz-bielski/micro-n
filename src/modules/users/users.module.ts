import { Module } from '@nestjs/common';

// modules
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../mail/mail.module';

// components
import { userProviders } from './users.providers';
import { UsersService } from './services/users.service';
import { AvailabilityService } from './services/availability.service';
import { VerificationService } from './services/verification.service';

import { UsersController } from './users.controller';

@Module({
    modules: [
        DatabaseModule,
        AuthModule,
        MailModule,
    ],
    controllers: [
        UsersController,
    ],
    components: [
        ...userProviders,
        AvailabilityService,
        VerificationService,
        UsersService,
    ],
})
export class UsersModule {}
