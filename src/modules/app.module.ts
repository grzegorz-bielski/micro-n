import { Module, MiddlewaresConsumer, RequestMethod } from '@nestjs/common';

// modules
import { UsersModule } from './users/users.module';
import { PostsModule } from './posts/posts.module';

@Module({
    modules: [
        UsersModule,
        PostsModule,
    ],
})
export class ApplicationModule {}
