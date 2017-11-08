import { Module } from '@nestjs/common';

// modules
import { DatabaseModule } from '../database/database.module';

// componets
import { CommentsController } from './controllers/comments.controller';

@Module({
  modules: [
      DatabaseModule,
  ],
  controllers: [
    CommentsController,
  ],
  components: [
      // ...postProviders,
      // PostsService,
  ],
})
export class CommentsModule {}