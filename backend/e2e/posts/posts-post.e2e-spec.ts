import 'jest';
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

describe('Posts POST', () => {
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
    it('should throw HttpException for unauthorized request', async () => {
      const { body } = await request(server)
        .post(`/${prefix}/posts`)
        .send({ content: 'ewefwf' })
        .expect(403);

      expect(body.details).toBe('Forbidden resource');
    });

    it('should throw HttpException for invalid access token', async () => {
      const { body } = await request(server)
        .post(`/${prefix}/posts`)
        .send({ content: 'ewefwf' })
        .set('x-auth', 'wfwfwefwefvvvvv434')
        .expect(401);

      expect(body.type).toBe('HttpException');
    });

    it('should create a new post for authorized user', async () => {
      const { generatedUsers } = dbContent;
      const post = {
        content: 'ewefwf',
        image: {
          fileName: 'fuu',
          isNsfw: false,
          image: 'data:image/gif;base64,R0lGODlhAQABAIAAAP///////yH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==',
        },
        meta: {
          tags: [
            'marshmallow', 'dva', 'typescript',
          ],
        },
      };
      const { body: logInBody } = await request(server)
        .post(`/${prefix}/users/login`)
        .send({ email: generatedUsers[0].email, password: generatedUsers[0].password })
        .expect(200);

      const { body: newPostBody } = await request(server)
        .post(`/${prefix}/posts`)
        .send(post)
        .set('x-auth', logInBody.meta.accessToken)
        .set('x-refresh', logInBody.meta.refreshToken)
        .expect(201);

      const [ image, dbPost ] = await Promise.all([
        getImage(newPostBody.data.image.fileName),
        postRepository.findOneById(newPostBody.data.id),
      ]);

      // post
      expect(newPostBody.data.content).toBe(post.content);
      expect(dbPost).toBeDefined();
      expect(dbPost.id).toBe(newPostBody.data.id);
      expect(dbPost.content).toBe(newPostBody.data.content);

      // tags
      expect(newPostBody.data.tags).toHaveLength(3);

      // image
      expect(image).toBeDefined();
      expect(image).toBeInstanceOf(Buffer);
      expect(typeof newPostBody.data.image.fileName).toBe('string');
      expect(newPostBody.data.image.isNsfw).toBe(post.image.isNsfw);

      await deleteImage(newPostBody.data.image.fileName);
    });
  });
});