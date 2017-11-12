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
// import { PostImageEntity } from '../src/modules/posts/entities/post-image.entity';
// import { AuthModule } from '../src/modules/auth/auth.module';
import { DatabaseModule } from '../src/modules/database/database.module';
import { UsersModule } from '../src/modules/users/users.module';
// import { PostsModule } from '../src/modules/posts/posts.module';
import { CommentsModule } from '../src/modules/comments/comments.module';
import { CommentsService } from '../src/modules/comments/services/comments.service';
// import { PostsService } from '../src/modules/posts/services/posts.service';
import { MySQLConnectionToken } from '../src/modules/constants';

// bigger timeout to populate / flush db
jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000000;

describe('CommentsModule', () => {
  // server config
  const prefix = 'api';
  const server = express();

  // module config
  // let postsService: PostsService;
  let commentsService: CommentsService;
  let connection: Connection;
  let commentRepository: Repository<CommentEntity>;
  // let postRepository: Repository<PostEntity>;

  // dummy content
  let generatedUsers: User[];
  let dbUsers: UserEntity[];
  let dbPosts: PostEntity[];
  let dbComments: CommentEntity[];

  setUpConfig();

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      modules: [
        CommentsModule,
        UsersModule,
      ],
    }).compile();

    await configureApp(
      module.createNestApplication(server),
    ).init();

    const commentsModule = module.select<CommentsModule>(CommentsModule);
    const dbModule = module.select<DatabaseModule>(DatabaseModule);
    connection = dbModule.get(MySQLConnectionToken);
    commentsService = commentsModule.get<CommentsService>(CommentsService);

    // hack...
    // tslint:disable-next-line
    commentRepository = commentsService['commentRepository'];
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

  describe('GET /comments/post/:id', () => {
    it('shouldn\'t return any comments if post doesn\'t exists', async () => {
      const { body: getCommentsBody } = await request(server)
        .get(`/${prefix}/comments/post/34534564564564564564564534566`)
        .expect(404);

      expect(getCommentsBody.type).toBe('HttpException');
    });

    it('shouldn\'t return any comments if given post doesn\'t have any', async () => {
      const { body: getCommentsBody } = await request(server)
        .get(`/${prefix}/comments/post/${dbPosts[1].id}`)
        .expect(404);

      expect(getCommentsBody.type).toBe('HttpException');
    });

    it('should return all comments for given post', async () => {
      const { body: getCommentsBody } = await request(server)
        .get(`/${prefix}/comments/post/${dbPosts[0].id}`)
        .expect(200);

      expect(getCommentsBody.data[0].id).toBe(dbComments[0].id);
      expect(getCommentsBody.data[0].content).toBe(dbComments[0].content);
    });
  });

  describe('GET /comments/:id', () => {
    it('shouldn\'t return comment for incorrect id', async () => {
      const { body: getCommentsBody } = await request(server)
        .get(`/${prefix}/comments/54355345353456456464564564`)
        .expect(404);

      expect(getCommentsBody.type).toBe('HttpException');
    });

    it('should return comment if it exists', async () => {
      const { body: getCommentsBody } = await request(server)
        .get(`/${prefix}/comments/${dbComments[0].id}`)
        .expect(200);

      // console.log(getCommentsBody);
      expect(getCommentsBody).toBeDefined();
      expect(getCommentsBody.data.id).toBe(dbComments[0].id);
      expect(getCommentsBody.data.content).toBe(dbComments[0].content);
    });
  });

  describe('POST /comments/post/:id', () => {
    it('shouldn\'t create new comment if post doesnt\'t exists', async () => {
      // login
      const { body: logInBody } = await request(server)
        .post(`/${prefix}/users/login`)
        .send({ email: generatedUsers[0].email, password: generatedUsers[0].password })
        .expect(200);

      // post comment
      const { body: newCommentBody } = await request(server)
        .post(`/${prefix}/comments/post/3656445645645645653646456`)
        .send({ content: 'kek' })
        .set('x-auth', logInBody.meta.accessToken)
        .set('x-refresh', logInBody.meta.refreshToken)
        .expect(404);

      expect(newCommentBody.type).toBe('HttpException');
    });

    it('shouldn\'t create new comment if data is invalid', async () => {
      // login
      const { body: logInBody } = await request(server)
        .post(`/${prefix}/users/login`)
        .send({ email: generatedUsers[0].email, password: generatedUsers[0].password })
        .expect(200);

      // post comment
      const { body: newCommentBody } = await request(server)
        .post(`/${prefix}/comments/post/${dbPosts[1].id}`)
        .send({ kek: null })
        .set('x-auth', logInBody.meta.accessToken)
        .set('x-refresh', logInBody.meta.refreshToken)
        .expect(400);

      expect(newCommentBody.type).toBe('HttpException');
    });

    it('should create new comment for given post', async () => {
      const comment = {
        content: 'reeee',
        image: {
          fileName: 'foo',
          image: 'data:image/gif;base64,R0lGODlhAQABAIAAAP///////yH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==',
        },
      };

      // login
      const { body: logInBody } = await request(server)
        .post(`/${prefix}/users/login`)
        .send({ email: generatedUsers[0].email, password: generatedUsers[0].password })
        .expect(200);

      // post comment
      const { body: newCommentBody } = await request(server)
        .post(`/${prefix}/comments/post/${dbPosts[1].id}`)
        .send(comment)
        .set('x-auth', logInBody.meta.accessToken)
        .set('x-refresh', logInBody.meta.refreshToken)
        .expect(201);

      const dbComment = await commentRepository.findOneById(newCommentBody.data.id);

      expect(newCommentBody.data).toBeDefined();
      expect(newCommentBody.data.content).toBe(comment.content);
      expect(dbComment).toBeDefined();
      expect(dbComment.id).toBe(newCommentBody.data.id);
      expect(dbComment.content).toBe(newCommentBody.data.content);

      await deleteImage(newCommentBody.data.image.fileName);
    });
  });

  describe('PATCH /comments/:id', () => {
    it('shouldn\'t update comment if user is invalid', async () => {
      // login
      const { body: logInBody } = await request(server)
        .post(`/${prefix}/users/login`)
        .send({ email: generatedUsers[1].email, password: generatedUsers[1].password })
        .expect(200);

      // update
      const { body: updateCommentBody } = await request(server)
        .patch(`/${prefix}/comments/${dbComments[0].id}`)
        .send({ content: 'foo-bar'})
        .set('x-auth', logInBody.meta.accessToken)
        .set('x-refresh', logInBody.meta.refreshToken)
        .expect(403);

      expect(updateCommentBody.type).toBe('HttpException');
    });

    it('should update given comment if user is valid', async () => {
      const comment = {
        content: 'reeee',
        image: {
          fileName: 'foo',
          image: 'data:image/gif;base64,R0lGODlhAQABAIAAAP///////yH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==',
        },
      };

      // login
      const { body: logInBody } = await request(server)
        .post(`/${prefix}/users/login`)
        .send({ email: generatedUsers[0].email, password: generatedUsers[0].password })
        .expect(200);

      // update
      const { body: updateCommentBody } = await request(server)
        .patch(`/${prefix}/comments/${dbComments[0].id}`)
        .send(comment)
        .set('x-auth', logInBody.meta.accessToken)
        .set('x-refresh', logInBody.meta.refreshToken)
        .expect(200);

      const dbComment = await commentRepository.findOneById(updateCommentBody.data.id);

      expect(comment.content).not.toBe(dbComments[0].content);
      expect(updateCommentBody).toBeDefined();
      expect(updateCommentBody.data.content).toBe(comment.content);
      expect(updateCommentBody.data.id).toBe(dbComments[0].id);
      expect(dbComment.content).toBe(updateCommentBody.data.content);
      expect(dbComment.id).toBe(updateCommentBody.data.id);
      expect(dbComment.content).toBe(comment.content);

      await deleteImage(updateCommentBody.data.image.fileName);
    });

    it('should update comment with diffirent imagetype', async () => {
      const comment = {
        content: 'k3k',
        image: {
          directLink: 'http://www.example.com/image.jpeg',
        },
      };

      // login
      const { body: logInBody } = await request(server)
        .post(`/${prefix}/users/login`)
        .send({ email: generatedUsers[0].email, password: generatedUsers[0].password })
        .expect(200);

      // update
      const { body: updateCommentBody } = await request(server)
        .patch(`/${prefix}/comments/${dbComments[0].id}`)
        .send(comment)
        .set('x-auth', logInBody.meta.accessToken)
        .set('x-refresh', logInBody.meta.refreshToken)
        .expect(200);

      const dbComment = await commentRepository.findOneById(updateCommentBody.data.id);

      // expect(comment.content).not.toBe(dbComments[0].content);
      expect(updateCommentBody).toBeDefined();
      expect(updateCommentBody.data.image.directLink).toBe(comment.image.directLink);
      expect(updateCommentBody.data.id).toBe(dbComments[0].id);
      expect(dbComment.id).toBe(updateCommentBody.data.id);
      // expect(dbComment.image.directLink).toBe(comment.image.directLink);

    });
  });

  describe('DELETE /comments/:id', () => {
    it('should delete comment if user is valid', async () => {
      // TODO
    });
  });

});
