import { Module } from '@nestjs/common';

// modules
import { DatabaseModule } from '../database/database.module';

// componets
import { TagsService } from './services/tags.service';
import { tagProviders } from './providers/tags.providers';
import { TagsController } from './controllers/tags.controller';
import { MsgPaginationService } from '../common/services/msg-pagination.service';

@Module({
  modules: [
      DatabaseModule,
  ],
  components: [
      ...tagProviders,
      TagsService,
      MsgPaginationService,
  ],
  controllers: [
    TagsController,
  ],
  exports: [
    TagsService,
  ],
})
export class TagsModule {}