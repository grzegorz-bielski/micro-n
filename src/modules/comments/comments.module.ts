import { Module } from '@nestjs/common';

// modules
import { DatabaseModule } from '../database/database.module';

// componets
import { CommentsController } from './controllers/comments.controller';
import { commentsProviders } from './providers/comments.providers';
import { CommentsService } from './services/comments.service';

@Module({
  modules: [
      DatabaseModule,
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
