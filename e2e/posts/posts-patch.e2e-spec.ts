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

describe('Posts PATCH', () => {
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

  describe('/posts/:id', () => {
    it('shouldn\'t update someone\'s else post', async () => {
      const { dbPosts, generatedUsers } = dbContent;
      const { body: logInBody } = await request(server)
        .post(`/${prefix}/users/login`)
        .send({ email: generatedUsers[0].email, password: generatedUsers[0].password })
        .expect(200);

      const { body: patchPostBody } = await request(server)
        .patch(`/${prefix}/posts/${dbPosts[7].id}`)
        .send({ content: 'kek' })
        .set('x-auth', logInBody.meta.accessToken)
        .set('x-refresh', logInBody.meta.refreshToken)
        .expect(403);

      expect(patchPostBody.type).toBe('HttpException');
    });

    it('should update post of proper user', async () => {
      const { dbPosts, generatedUsers } = dbContent;
      const { body: logInBody } = await request(server)
        .post(`/${prefix}/users/login`)
        .send({ email: generatedUsers[0].email, password: generatedUsers[0].password })
        .expect(200);

      const dbPostPre = await postRepository.findOneById(dbPosts[0].id);
      const post = {
        content: 'kek',
        meta: {
          tags: [
            'kek', 'dummy',
          ],
        },
      };

      expect(dbPostPre.tags).toHaveLength(3);
      expect(dbPostPre.tags[0].name).not.toBe(post.meta.tags[0]);
      expect(dbPostPre.content).not.toBe(post.content);

      const { body: patchPostBody } = await request(server)
        .patch(`/${prefix}/posts/${dbPosts[0].id}`)
        .send(post)
        .set('x-auth', logInBody.meta.accessToken)
        .set('x-refresh', logInBody.meta.refreshToken)
        .expect(200);

      const dbPost = await postRepository.findOneById(dbPosts[0].id);

      expect(patchPostBody.data.content).toBe(post.content);
      expect(patchPostBody.data.tags).toHaveLength(2);
      expect(dbPost.tags).toHaveLength(2);
      expect(dbPost.content).toBe(post.content);

    });
  });
});