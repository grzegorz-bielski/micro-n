import { Module } from '@nestjs/common';

// modules
import { DatabaseModule } from '../database/database.module';

// componets
import { TagsService } from './services/tags.service';
import { tagProviders } from './providers/tags.providers';
import { TagsController } from './controllers/tags.controller';

@Module({
  modules: [
      DatabaseModule,
  ],
  components: [
      ...tagProviders,
      TagsService,
  ],
  controllers: [
    TagsController,
  ],
  exports: [
    TagsService,
  ],
})
export class TagsModule {}