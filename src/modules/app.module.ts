import { Module, MiddlewaresConsumer, RequestMethod } from '@nestjs/common';

// modules
import { UsersModule } from './users/users.module';
import { PostsModule } from './posts/posts.module';
// import { CommentsModule } from './comments/comments.module';

@Module({
    modules: [
        UsersModule,
        PostsModule,
        // CommentsModule,
    ],
})
export class ApplicationModule {}
