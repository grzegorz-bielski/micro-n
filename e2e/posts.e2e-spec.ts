import * as request from 'supertest';
import * as faker from 'faker';
import * as express from 'express';
import * as path from 'path';
import { Test } from '@nestjs/testing';
import { Repository, Connection } from 'typeorm';

import { flushDb, populateDb } from './seed';
import { getImage, deleteImage } from '../src/modules/common/util/files';
import { setUpConfig } from '../src/config/configure';
import { configureApp } from '../src/server';
import { User } from '../src/modules/users/interfaces/user.interface';
import { UserEntity } from '../src/modules/users/entities/user.entity';
import { PostEntity } from '../src/modules/posts/entities/post.entity';
import { CommentEntity } from '../src/modules/comments/entities/comment.entity';
import { PostImageEntity } from '../src/modules/posts/entities/post-image.entity';
import { AuthModule } from '../src/modules/auth/auth.module';
import { DatabaseModule } from '../src/modules/database/database.module';
import { UsersModule } from '../src/modules/users/users.module';
import { PostsModule } from '../src/modules/posts/posts.module';
import { PostsService } from '../src/modules/posts/services/posts.service';
import { MySQLConnectionToken } from '../src/modules/constants';

// bigger timeout to populate / flush db
jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000000;

describe('PostsModule', () => {
  // server config
  const prefix = 'api';
  const server = express();

  // module config
  let postsService: PostsService;
  let connection: Connection;
  let postRepository: Repository<PostEntity>;

  // dummy content
  let generatedUsers: User[];
  let dbUsers: UserEntity[];
  let dbPosts: PostEntity[];
  let dbComments: CommentEntity[];

  setUpConfig();

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      modules: [
        PostsModule,
        UsersModule,
      ],
    }).compile();

    await configureApp(
      module.createNestApplication(server),
    ).init();

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
      const {
        usersEntity,
        postsEntity,
        commentsEntity,
        users,
      } = await populateDb(connection);
      dbUsers = usersEntity;
      dbPosts = postsEntity;
      dbComments = commentsEntity;
      generatedUsers = users;
    } catch (error) {
      console.log('DB ERROR', error);
    }
  });

  afterAll(async () => {
    await flushDb(connection);
  });

  describe('GET /posts', () => {
    it('should return an array of posts', async () => {
      const { body } = await request(server)
        .get(`/${prefix}/posts`)
        .expect(200);

      const dbPost = dbPosts.find(post => post.id === body.data[0].id);

      expect(body.data).toBeDefined();
      expect(Array.isArray(body.data)).toBe(true);
      expect(dbPost).toBeDefined();
      expect(dbPost.id).toBe(body.data[0].id);
      expect(dbPost.content).toBe(body.data[0].content);
    });
  });

  describe('GET /posts/:id', () => {
    it('should return post if id is valid', async () => {
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

  describe('POST /posts/new', () => {
    it('should throw HttpException for unauthorized request', async () => {
      const { body } = await request(server)
        .post(`/${prefix}/posts`)
        .send({ content: 'ewefwf' })
        .expect(403);

      expect(body.type).toBe('HttpException');
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
      const post = {
        content: 'ewefwf',
        image: {
          fileName: 'fuu',
          isNsfw: false,
          image: 'data:image/gif;base64,R0lGODlhAQABAIAAAP///////yH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==',
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

      const image: Buffer = await getImage(newPostBody.data.image.fileName);
      expect(image).toBeDefined();
      expect(image).toBeInstanceOf(Buffer);
      expect(newPostBody.data.content).toBe(post.content);
      expect(typeof newPostBody.data.image.fileName).toBe('string');
      expect(newPostBody.data.image.isNsfw).toBe(post.image.isNsfw);

      await deleteImage(newPostBody.data.image.fileName);
    });
  });

  describe('/PATCH /posts/:id', () => {
    it('shouldn\'t update someone\'s else post', async () => {
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
      const { body: logInBody } = await request(server)
        .post(`/${prefix}/users/login`)
        .send({ email: generatedUsers[0].email, password: generatedUsers[0].password })
        .expect(200);

      const content = 'kek';

      const { body: patchPostBody } = await request(server)
        .patch(`/${prefix}/posts/${dbPosts[0].id}`)
        .send({ content })
        .set('x-auth', logInBody.meta.accessToken)
        .set('x-refresh', logInBody.meta.refreshToken)
        .expect(200);

      const dbPost = await postRepository.findOneById(dbPosts[0].id);

      expect(patchPostBody.data.content).toBe(content);
      expect(dbPost.content).toBe(content);
    });
  });

  describe('DELETE /posts/:id', () => {
    it('shouldn\'t delete someone\'s else post', async () => {
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
      const { body: logInBody } = await request(server)
        .post(`/${prefix}/users/login`)
        .send({ email: generatedUsers[0].email, password: generatedUsers[0].password })
        .expect(200);

      const { body: deletePostBody } = await request(server)
        .delete(`/${prefix}/posts/${dbPosts[0].id}`)
        .set('x-auth', logInBody.meta.accessToken)
        .set('x-refresh', logInBody.meta.refreshToken)
        .expect(200);
      // console.log(deletePostBody);

      const dbPost = await postRepository.findOneById(dbPosts[0].id);

      expect(dbPost).toBeUndefined();
    });

    it('should delete new post with image upload', async () => {
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