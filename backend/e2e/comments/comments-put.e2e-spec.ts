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
import { CommentEntity } from '../../src/modules/comments/entities/comment.entity';
import { DatabaseModule } from '../../src/modules/database/database.module';
import { UsersModule } from '../../src/modules/users/users.module';
import { CommentsModule } from '../../src/modules/comments/comments.module';
import { CommentsService } from '../../src/modules/comments/services/comments.service';
import { MySQLConnectionToken } from '../../src/modules/constants';
import { CommentVoteEntity } from '../../src/modules/comments/entities/comment-vote.entity';

// bigger timeout to populate / flush db
jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000000;

describe('Comments PUT', () => {
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
    // hackS...
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

  describe('/vote/:id', () => {
    it('shouldn\'t create new vote if one already exists', async () => {
      const { generatedUsers, dbComments } = dbContent;
      const { body: logInBody } = await request(server)
        .post(`/${prefix}/users/login`)
        .send({ email: generatedUsers[0].email, password: generatedUsers[0].password })
        .expect(200);

      const { body: putBody } = await request(server)
        .put(`/${prefix}/comments/vote/${dbComments[0].id}`)
        .set('x-auth', logInBody.meta.accessToken)
        .set('x-refresh', logInBody.meta.refreshToken)
        .expect(403);

      expect(putBody.details).toBe('You can\'t vote twice');
      expect(putBody.type).toBe('HttpException');
    });

    it('should create new vote if there is none', async () => {
      const { generatedUsers, dbComments, dbUsers } = dbContent;
      const { body: logInBody } = await request(server)
        .post(`/${prefix}/users/login`)
        .send({ email: generatedUsers[0].email, password: generatedUsers[0].password })
        .expect(200);

      const voteBefore = await commentVoteRepository.findOne({
        where: { commentId: dbComments[1].id, userId: dbUsers[0].id  },
      });

      expect(voteBefore).not.toBeDefined();

      const { body: putBody } = await request(server)
        .put(`/${prefix}/comments/vote/${dbComments[1].id}`)
        .set('x-auth', logInBody.meta.accessToken)
        .set('x-refresh', logInBody.meta.refreshToken)
        .expect(201);

      const voteAfter = await commentVoteRepository.findOne({
        where: { commentId: dbComments[1].id, userId: dbUsers[0].id  },
      });

      expect(voteAfter).toBeDefined();
    });
  });
});