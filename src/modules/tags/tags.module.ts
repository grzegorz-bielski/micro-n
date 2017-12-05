import { Module } from '@nestjs/common';

// modules
import { DatabaseModule } from '../database/database.module';

// componets
import { TagsService } from './services/tags.service';
import { tagProviders } from './providers/tags.providers';

@Module({
  modules: [
      DatabaseModule,
  ],
  components: [
      ...tagProviders,
      TagsService,
  ],
  exports: [
    TagsService,
  ],
})
export class TagsModule {}