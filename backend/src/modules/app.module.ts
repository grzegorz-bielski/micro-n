import { Module, MiddlewaresConsumer, RequestMethod } from '@nestjs/common';

import { UsersModule } from './users/users.module';
import { PostsModule } from './posts/posts.module';

@Module({
    modules: [
        UsersModule,
        PostsModule,
    ],
})
export class ApplicationModule {}
