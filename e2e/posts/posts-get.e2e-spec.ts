import * as request from 'supertest';
import * as faker from 'faker';
import * as express from 'express';
import * as path from 'path';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common/interfaces';
import { Repository, Connection } from 'typeorm';

import { flushDb, populateDb } from '../seed/seed-gen';
import { DbContent } from '../seed/seed-interfaces';
import { getImage, deleteImage } from '../../src/modules/common/util/files';
import { setUpConfig } from '../../src/config/configure';
import { configureApp } from '../../src/server';
import { User } from '../../src/modules/users/interfaces/user.interface';
import { TagEntity } from '../../src/modules/tags/entities/tag.entity';
import { UserEntity } from '../../src/modules/users/entities/user.entity';
import { PostEntity } from '../../src/modules/posts/entities/post.entity';
import { CommentEntity } from '../../src/modules/comments/entities/comment.entity';
import { PostImageEntity } from '../../src/modules/posts/entities/post-image.entity';
import { AuthModule } from '../../src/modules/auth/auth.module';
import { DatabaseModule } from '../../src/modules/database/database.module';
import { UsersModule } from '../../src/modules/users/users.module';
import { PostsModule } from '../../src/modules/posts/posts.module';
import { PostsService } from '../../src/modules/posts/services/posts.service';
import { MySQLConnectionToken } from '../../src/modules/constants';

// bigger timeout to populate / flush db
jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000000;

describe('Posts GET', () => {
  // server config
  const prefix = 'api';
  const server = express();
  let app: INestApplication;

  // module config
  let postsService: PostsService;
  let connection: Connection;
  let postRepository: Repository<PostEntity>;

  // dummy content
  let dbContent: DbContent;

  setUpConfig();

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      modules: [
        PostsModule,
        UsersModule,
      ],
    }).compile();

    app = configureApp(module.createNestApplication(server));
    await app.listen(8080);

    const postModule = module.select<PostsModule>(PostsModule);
    const dbModule = module.select<DatabaseModule>(DatabaseModule);
    connection = dbModule.get(MySQLConnectionToken);
    postsService = postModule.get<PostsService>(PostsService);
    // hack...
    // tslint:disable-next-line
    postRepository = postsService['postRepository'];

  });

  beforeEach(async () => {
    try {
      await flushDb(connection);
      dbContent = await populateDb(connection);
    } catch (error) {
      console.log('DB ERROR', error);
    }
  });

  afterAll(async () => {
    try {
      await Promise.all([app.close(), flushDb(connection)]);
    } catch (error) {
      console.log('DB ERROR', error);
    }
  });

  describe('/posts', () => {
    it('should return an array of posts for 1st page', async () => {
      const { body } = await request(server)
        .get(`/${prefix}/posts`)
        .expect(200);
      const { dbPosts } = dbContent;

      const dbPost = dbPosts.find(post => post.id === body.data[0].id);

      expect(body.data).toBeDefined();
      expect(Array.isArray(body.data)).toBe(true);
      expect(dbPost).toBeDefined();
      expect(dbPost.id).toBe(body.data[0].id);
      expect(dbPost.content).toBe(body.data[0].content);
    });

    it('should return 2 posts from 1st page for given post', async () => {
      const { body } = await request(server)
        .get(`/${prefix}/posts?page=1&limit=2`)
        .expect(200);
      const { dbPosts } = dbContent;

      const dbPost = dbPosts.find(post => post.id === body.data[0].id);

      expect(body.data[0].id).toBe(dbPost.id);
      expect(body.data[0].content).toBe(dbPost.content);
      expect(body.meta.count).toBe(15);
      expect(body.meta.pages).toBe(8);
    });
  });

  describe('/posts/:id', () => {
    it('should return post if id is valid', async () => {
      const { dbPosts } = dbContent;
      const { body } = await request(server)
        .get(`/${prefix}/posts/${dbPosts[0].id}`)
        .expect(200);

      expect(body.data.id).toBe(dbPosts[0].id);
      expect(body.data.content).toBe(dbPosts[0].content);
    });

    it('should return HttpException if post is not found', async () => {
      const { body } = await request(server)
        .get(`/${prefix}/posts/3222777`)
        .expect(404);

      expect(body.type).toBe('HttpException');
    });
  });
});