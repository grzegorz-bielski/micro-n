import * as request from 'supertest';
import * as faker from 'faker';
import * as express from 'express';
import * as path from 'path';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common/interfaces';
import { Repository, Connection } from 'typeorm';

import { DbContent, flushDb, populateDb } from '../seed';
import { getImage, deleteImage } from '../../src/modules/common/util/files';
import { setUpConfig } from '../../src/config/configure';
import { configureApp } from '../../src/server';
// import { User } from '../../src/modules/users/interfaces/user.interface';
// import { TagEntity } from '../../src/modules/tags/entities/tag.entity';
// import { UserEntity } from '../../src/modules/users/entities/user.entity';
// import { PostEntity } from '../../src/modules/posts/entities/post.entity';
import { CommentEntity } from '../../src/modules/comments/entities/comment.entity';
// import { PostImageEntity } from '../../src/modules/posts/entities/post-image.entity';
// import { AuthModule } from '../../src/modules/auth/auth.module';
import { DatabaseModule } from '../../src/modules/database/database.module';
import { UsersModule } from '../../src/modules/users/users.module';
import { CommentsModule } from '../../src/modules/comments/comments.module';
import { CommentsService } from '../../src/modules/comments/services/comments.service';
import { MySQLConnectionToken } from '../../src/modules/constants';

// bigger timeout to populate / flush db
// jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000000;

describe('Comments PATCH', () => {
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

  describe('/comments/:id', () => {
    it('shouldn\'t update comment if user is invalid', async () => {
      const { generatedUsers, dbComments } = dbContent;
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
      const { generatedUsers, dbComments } = dbContent;
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
        .set('x-refresh', logInBody.meta.refreshToken);
        // .expect(200);

      // console.log(updateCommentBody.details.reasons[0].children);

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
      const { generatedUsers, dbComments } = dbContent;
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

      // console.log(updateCommentBody.details.reasons[0].children);

      const dbComment = await commentRepository.findOneById(updateCommentBody.data.id);

      // expect(comment.content).not.toBe(dbComments[0].content);
      expect(updateCommentBody).toBeDefined();
      expect(updateCommentBody.data.image.directLink).toBe(comment.image.directLink);
      expect(updateCommentBody.data.id).toBe(dbComments[0].id);
      expect(dbComment.id).toBe(updateCommentBody.data.id);
      // expect(dbComment.image.directLink).toBe(comment.image.directLink);

    });
  });
});