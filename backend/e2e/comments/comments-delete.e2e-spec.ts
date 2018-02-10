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
import { CommentEntity } from '../../src/modules/comments/entities/comment.entity';
import { DatabaseModule } from '../../src/modules/database/database.module';
import { UsersModule } from '../../src/modules/users/users.module';
import { CommentsModule } from '../../src/modules/comments/comments.module';
import { CommentsService } from '../../src/modules/comments/services/comments.service';
import { MySQLConnectionToken } from '../../src/modules/constants';
import { CommentVoteEntity } from '../../src/modules/comments/entities/comment-vote.entity';

// bigger timeout to populate / flush db
jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000000;

describe('Comments DELETE', () => {
  // server config
  const prefix = 'api';
  const server = express();
  let app: INestApplication;

  // module config
  let commentsService: CommentsService;
  let connection: Connection;
  let commentRepository: Repository<CommentEntity>;
  let commentVoteRepository: Repository<CommentVoteEntity>;

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
    // hacks...
    // tslint:disable-next-line
    commentRepository = commentsService['commentRepository'];
    // tslint:disable-next-line
    commentVoteRepository = commentsService['commentVoteRepository'];

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
      const { dbComments, dbUsers, generatedUsers } = dbContent;
      const { body: logInBody } = await request(server)
        .post(`/${prefix}/users/login`)
        .send({ email: generatedUsers[0].email, password: generatedUsers[0].password })
        .expect(200);

      const voteBefore = await commentVoteRepository.findOne({
        where: { commentId: dbComments[0].id, userId: dbUsers[0].id },
      });

      expect(voteBefore).toBeDefined();

      await request(server)
        .delete(`/${prefix}/comments/vote/${dbComments[0].id}`)
        .set('x-auth', logInBody.meta.accessToken)
        .set('x-refresh', logInBody.meta.refreshToken)
        .expect(200);

      const voteAfter = await commentVoteRepository.findOne({
        where: { commentId: dbComments[0].id, userId: dbUsers[0].id },
      });

      expect(voteAfter).not.toBeDefined();
    });

    it('shoulnd throw HttpException if vote was already deleted/doesn\'t exists', async () => {
      const { dbComments, dbUsers, generatedUsers } = dbContent;
      const { body: logInBody } = await request(server)
        .post(`/${prefix}/users/login`)
        .send({ email: generatedUsers[0].email, password: generatedUsers[0].password })
        .expect(200);

      await request(server)
        .delete(`/${prefix}/comments/vote/${dbComments[0].id}`)
        .set('x-auth', logInBody.meta.accessToken)
        .set('x-refresh', logInBody.meta.refreshToken)
        .expect(200);

      await request(server)
        .delete(`/${prefix}/comments/vote/${dbComments[0].id}`)
        .set('x-auth', logInBody.meta.accessToken)
        .set('x-refresh', logInBody.meta.refreshToken)
        .expect(404);
    });
  });

  describe('/comments/:id', () => {
    it('should delete comment if user is valid', async () => {
      const { generatedUsers, dbComments } = dbContent;

      // login
      const { body: logInBody } = await request(server)
        .post(`/${prefix}/users/login`)
        .send({ email: generatedUsers[0].email, password: generatedUsers[0].password })
        .expect(200);

      // delete
      const { body: updateCommentBody } = await request(server)
        .delete(`/${prefix}/comments/${dbComments[0].id}`)
        .set('x-auth', logInBody.meta.accessToken)
        .set('x-refresh', logInBody.meta.refreshToken)
        .expect(200);

      const dbComment = await commentRepository.findOneById(dbComments[0].id);

      expect(dbComment).toBeUndefined();
    });

    it('should throw HttpException if tokens are invalid', async () => {
      const { generatedUsers, dbComments } = dbContent;

      // login
      const { body: logInBody } = await request(server)
        .post(`/${prefix}/users/login`)
        .send({ email: generatedUsers[0].email, password: generatedUsers[0].password })
        .expect(200);

      // delete
      await request(server)
        .delete(`/${prefix}/comments/${dbComments[0].id}`)
        .set('x-auth', 'ergergergerg')
        .set('x-refresh', 'rererereer')
        .expect(401);
      });

    it('shouldn\'t delete post of other user', async () => {
      const { generatedUsers, dbComments } = dbContent;

      // login
      const { body: logInBody } = await request(server)
        .post(`/${prefix}/users/login`)
        .send({ email: generatedUsers[0].email, password: generatedUsers[0].password })
        .expect(200);

      // delete
      await request(server)
        .delete(`/${prefix}/comments/${dbComments[6].id}`)
        .set('x-auth', logInBody.meta.accessToken)
        .set('x-refresh', logInBody.meta.refreshToken)
        .expect(403);
    });
  });
});