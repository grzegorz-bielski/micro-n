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
import { PostVoteEntity } from '../../src/modules/posts/entities/post-vote.entity';

// bigger timeout to populate / flush db
jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000000;

describe('Posts DELETE', () => {
  // server config
  const prefix = 'api';
  const server = express();
  let app: INestApplication;

  // module config
  let postsService: PostsService;
  let connection: Connection;
  let postRepository: Repository<PostEntity>;
  let postVoteRepository: Repository<PostVoteEntity>;

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

    // tslint:disable-next-line
    postVoteRepository = postsService['postVotesRepository'];

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

  describe('/posts/vote/:id', () => {
    it('should delete existing vote of proper user', async () => {
      const { dbPosts, dbUsers, generatedUsers } = dbContent;
      const { body: logInBody } = await request(server)
        .post(`/${prefix}/users/login`)
        .send({ email: generatedUsers[0].email, password: generatedUsers[0].password })
        .expect(200);

      const voteBefore = await postVoteRepository.findOne({
        where: { postId: dbPosts[0].id, userId: dbUsers[0].id },
      });

      expect(voteBefore).toBeDefined();

      await request(server)
        .delete(`/${prefix}/posts/vote/${dbPosts[0].id}`)
        .set('x-auth', logInBody.meta.accessToken)
        .set('x-refresh', logInBody.meta.refreshToken)
        .expect(200);

      const voteAfter = await postVoteRepository.findOne({
        where: { postId: dbPosts[0].id, userId: dbUsers[0].id },
      });

      expect(voteAfter).not.toBeDefined();
    });

    it('shoulnd throw HttpException if vote was already deleted/doesn\'t exists', async () => {
      const { dbPosts, dbUsers, generatedUsers } = dbContent;
      const { body: logInBody } = await request(server)
        .post(`/${prefix}/users/login`)
        .send({ email: generatedUsers[0].email, password: generatedUsers[0].password })
        .expect(200);

      await request(server)
        .delete(`/${prefix}/posts/vote/${dbPosts[0].id}`)
        .set('x-auth', logInBody.meta.accessToken)
        .set('x-refresh', logInBody.meta.refreshToken)
        .expect(200);

      await request(server)
        .delete(`/${prefix}/posts/vote/${dbPosts[0].id}`)
        .set('x-auth', logInBody.meta.accessToken)
        .set('x-refresh', logInBody.meta.refreshToken)
        .expect(404);
    });
  });

  describe('/posts/:id', () => {
    it('shouldn\'t delete someone\'s else post', async () => {
      const { dbPosts, generatedUsers } = dbContent;
      const { body: logInBody } = await request(server)
        .post(`/${prefix}/users/login`)
        .send({ email: generatedUsers[0].email, password: generatedUsers[0].password })
        .expect(200);

      const { body: deletePostBody } = await request(server)
        .delete(`/${prefix}/posts/${dbPosts[7].id}`)
        .set('x-auth', logInBody.meta.accessToken)
        .set('x-refresh', logInBody.meta.refreshToken)
        .expect(403);

      expect(deletePostBody.type).toBe('HttpException');
    });

    it('should delete post of proper user', async () => {
      const { dbPosts, generatedUsers } = dbContent;

      // login
      const { body: logInBody } = await request(server)
        .post(`/${prefix}/users/login`)
        .send({ email: generatedUsers[0].email, password: generatedUsers[0].password })
        .expect(200);

      // delete post
      const { body: deletePostBody } = await request(server)
        .delete(`/${prefix}/posts/${dbPosts[0].id}`)
        .set('x-auth', logInBody.meta.accessToken)
        .set('x-refresh', logInBody.meta.refreshToken)
        .expect(200);

      const dbPost = await postRepository.findOneById(dbPosts[0].id);

      expect(dbPost).toBeUndefined();
    });

    it('should delete new post with image upload', async () => {
      const { dbPosts, generatedUsers } = dbContent;
      const post = {
        content: 'ewefwf',
        image: {
          fileName: 'fuu',
          isNsfw: false,
          image: 'data:image/gif;base64,R0lGODlhAQABAIAAAP///////yH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==',
        },
      };
      // login
      const { body: logInBody } = await request(server)
        .post(`/${prefix}/users/login`)
        .send({ email: generatedUsers[0].email, password: generatedUsers[0].password })
        .expect(200);

      // create post
      const { body: newPostBody } = await request(server)
        .post(`/${prefix}/posts`)
        .send(post)
        .set('x-auth', logInBody.meta.accessToken)
        .set('x-refresh', logInBody.meta.refreshToken)
        .expect(201);

      // delete it
      const { body: deletePostBody } = await request(server)
        .delete(`/${prefix}/posts/${newPostBody.data.id}`)
        .set('x-auth', logInBody.meta.accessToken)
        .set('x-refresh', logInBody.meta.refreshToken)
        .expect(200);

      const dbPost = await postRepository.findOneById(newPostBody.data.id);

      expect(dbPost).toBeUndefined();
    });
  });
});