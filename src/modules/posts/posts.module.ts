import { Module } from '@nestjs/common';

// modules
import { DatabaseModule } from '../database/database.module';
import { CommentsModule } from '../comments/comments.module';
import { TagsModule } from '../tags/tags.module';

// componets
import { PostsController } from './controllers/posts.controller';
import { postProviders } from './providers/posts.providers';
import { PostsService } from './services/posts.service';

@Module({
  modules: [
      DatabaseModule,
      CommentsModule,
      TagsModule,
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