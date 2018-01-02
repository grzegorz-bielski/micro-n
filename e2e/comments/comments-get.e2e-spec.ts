import * as request from 'supertest';
import * as faker from 'faker';
import * as express from 'express';
import * as path from 'path';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common/interfaces';
import { Repository, Connection } from 'typeorm';

import { DbContent, flushDb, populateDb } from '../seed';
// import { getImage, deleteImage } from '../../src/modules/common/util/files';
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

describe('Comments GET', () => {
  // server config
  const prefix = 'api';
  const server = express();
  let app: INestApplication;

  // module config
  let commentsService: CommentsService;
  let connection: Connection;
  let commentsRepository: Repository<CommentEntity>;

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
    commentsRepository = CommentsService['commentRepository'];

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
    it('shouldn\'t return any comments if post doesn\'t exists', async () => {
      const { body: getCommentsBody } = await request(server)
        .get(`/${prefix}/comments/post/34534564564564564564564534566`)
        .expect(404);

      expect(getCommentsBody.type).toBe('HttpException');
    });

    it('shouldn\'t return any comments if given post doesn\'t have any', async () => {
      const { dbPosts } = dbContent;
      const { body: getCommentsBody } = await request(server)
        .get(`/${prefix}/comments/post/${dbPosts[1].id}`)
        .expect(404);

      expect(getCommentsBody.type).toBe('HttpException');
    });

    it('should return all comments from 1st page for given post', async () => {
      const { dbPosts, dbComments } = dbContent;
      const { body: getCommentsBody } = await request(server)
        .get(`/${prefix}/comments/post/${dbPosts[0].id}`)
        .expect(200);

      expect(getCommentsBody.data[0].id).toBe(dbComments[0].id);
      expect(getCommentsBody.data[0].content).toBe(dbComments[0].content);
    });

    it('should return 2 comments from 1st page for given post', async () => {
      const { dbPosts, dbComments } = dbContent;
      const { body: getCommentsBody } = await request(server)
        .get(`/${prefix}/comments/post/${dbPosts[0].id}?page=1&limit=2`)
        .expect(200);

      expect(getCommentsBody.data[0].id).toBe(dbComments[0].id);
      expect(getCommentsBody.data[0].content).toBe(dbComments[0].content);
      expect(getCommentsBody.meta.count).toBe(18);
      expect(getCommentsBody.meta.pages).toBe(9);
    });
  });

  describe('/comments/:id', () => {
    it('shouldn\'t return comment for incorrect id', async () => {
      const { body: getCommentsBody } = await request(server)
        .get(`/${prefix}/comments/54355345353456456464564564`)
        .expect(404);

      expect(getCommentsBody.type).toBe('HttpException');
    });

    it('should return comment if it exists', async () => {
      const { dbComments } = dbContent;
      const { body: getCommentsBody } = await request(server)
        .get(`/${prefix}/comments/${dbComments[0].id}`)
        .expect(200);

      expect(getCommentsBody).toBeDefined();
      expect(getCommentsBody.data.id).toBe(dbComments[0].id);
      expect(getCommentsBody.data.content).toBe(dbComments[0].content);
    });
  });
});