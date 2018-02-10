import 'jest';
import { Test } from '@nestjs/testing';
import { setUpConfig } from '../../config/configure';

// modules
import { PostsModule } from './posts.module';
import { DatabaseModule } from '../database/database.module';

// components
import { postProviders } from './providers/posts.providers';
import { PostsService } from './services/posts.service';
import { PostsController } from './controllers/posts.controller';

describe('PostsModule', () => {
  let postsService: PostsService;

  setUpConfig();

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      modules: [
        PostsModule,
      ],
    }).compile();

    const postsModule = module.select<PostsModule>(PostsModule);
    postsService = postsModule.get<PostsService>(PostsService);
  });

  it('should create module', async () => {
    expect(postsService).toBeDefined();
  });
});