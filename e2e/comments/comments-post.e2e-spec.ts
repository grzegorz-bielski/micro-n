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
import { CommentEntity } from '../../src/modules/comments/entities/comment.entity';
import { DatabaseModule } from '../../src/modules/database/database.module';
import { UsersModule } from '../../src/modules/users/users.module';
import { CommentsModule } from '../../src/modules/comments/comments.module';
import { CommentsService } from '../../src/modules/comments/services/comments.service';
import { MySQLConnectionToken } from '../../src/modules/constants';

// bigger timeout to populate / flush db
// jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000000;

describe('Comments POST', () => {
  // server config
  const prefix = 'api';
  const server = express();
  let app: INestApplication;

  // module config
  let commentsService: CommentsService;
  let connection: Connection;
  let commentRepository: Repository<CommentEntity>;

  // dummy content
  let dbContent: DbContent;

  setUpConfig();

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      modules: [
        CommentsModule,
        UsersModule,
      ],
    }).compile();

    app = configureApp(module.createNestApplication(server));
    await app.listen(8080);

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

  describe('/comments/post/:id', () => {
    it('shouldn\'t create new comment if post doesnt\'t exists', async () => {
      const { generatedUsers } = dbContent;
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
      const { generatedUsers, dbPosts } = dbContent;

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
      const { generatedUsers, dbPosts } = dbContent;
      const comment = {
        content: 'reeee',
        image: {
          fileName: 'foo',
          image: 'data:image/gif;base64,R0lGODlhAQABAIAAAP///////yH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==',
        },
        meta: {
          tags: [
            'marshmallow', 'dva', 'typescript',
          ],
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

      // const dbComment = await commentRepository.findOneById(newCommentBody.data.id);
      const [ image, dbComment ] = await Promise.all([
        getImage(newCommentBody.data.image.fileName),
        commentRepository.findOneById(newCommentBody.data.id),
      ]);

      // comment
      expect(newCommentBody.data).toBeDefined();
      expect(newCommentBody.data.tags).toHaveLength(3);
      expect(newCommentBody.data.content).toBe(comment.content);
      expect(dbComment).toBeDefined();
      expect(dbComment.id).toBe(newCommentBody.data.id);
      expect(dbComment.content).toBe(newCommentBody.data.content);

      // image
      expect(image).toBeDefined();
      expect(image).toBeInstanceOf(Buffer);
      expect(typeof newCommentBody.data.image.fileName).toBe('string');
      // expect(newCommentBody.data.image.isNsfw).toBe(comment.image.isNsfw);

      await deleteImage(newCommentBody.data.image.fileName);
    });
  });
});