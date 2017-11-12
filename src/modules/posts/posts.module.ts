import { Module } from '@nestjs/common';

// modules
import { DatabaseModule } from '../database/database.module';
import { CommentsModule } from '../comments/comments.module';

// componets
import { PostsController } from './controllers/posts.controller';
import { postProviders } from './providers/posts.providers';
import { PostsService } from './services/posts.service';
// import { CommentsService } from '../comments/services/comments.service';

@Module({
  modules: [
      DatabaseModule,
      CommentsModule,
  ],
  controllers: [
     PostsController,
  ],
  components: [
      ...postProviders,
      PostsService,
  ],
})
export class PostsModule {}