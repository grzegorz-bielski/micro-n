import { Module } from '@nestjs/common';

// modules
import { DatabaseModule } from '../database/database.module';
import { TagsModule } from '../tags/tags.module';

// componets
import { CommentsController } from './controllers/comments.controller';
import { commentsProviders } from './providers/comments.providers';
import { CommentsService } from './services/comments.service';
import { MsgImageService } from '../common/services/msg-image.service';
import { MsgVoteService } from '../common/services/msg-vote.service';
import { MsgPaginationService } from '../common/services/msg-pagination.service';

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
    MsgImageService,
    MsgVoteService,
    MsgPaginationService,
  ],
  exports: [
    CommentsService,
  ],
})
export class CommentsModule {}
