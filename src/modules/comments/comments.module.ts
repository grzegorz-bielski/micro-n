import { Module } from '@nestjs/common';

// modules
import { DatabaseModule } from '../database/database.module';
import { TagsModule } from '../tags/tags.module';

// componets
import { CommentsController } from './controllers/comments.controller';
import { commentsProviders } from './providers/comments.providers';
import { CommentsService } from './services/comments.service';

@Module({
  modules: [
      DatabaseModule,
      TagsModule,
  ],
  controllers: [
    CommentsController,
  ],
  components: [
    ...commentsProviders,
    CommentsService,
  ],
  exports: [
    CommentsService,
  ],
})
export class CommentsModule {}
