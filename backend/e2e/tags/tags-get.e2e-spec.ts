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
import { TagEntity } from '../../src/modules/tags/entities/tag.entity';
import { PostEntity } from '../../src/modules/posts/entities/post.entity';
import { CommentEntity } from '../../src/modules/comments/entities/comment.entity';
import { DatabaseModule } from '../../src/modules/database/database.module';
import { UsersModule } from '../../src/modules/users/users.module';
import { PostsModule } from '../../src/modules/posts/posts.module';
import { CommentsModule } from '../../src/modules/comments/comments.module';
import { PostsService } from '../../src/modules/posts/services/posts.service';
import { CommentsService } from '../../src/modules/comments/services/comments.service';
import { MySQLConnectionToken } from '../../src/modules/constants';

// bigger timeout to populate / flush db
jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000000;

describe('Tags GET', () => {
  // server config
  const prefix = 'api';
  const server = express();
  let app: INestApplication;

  // module config
  let connection: Connection;
  let postsService: PostsService;
  let postRepository: Repository<PostEntity>;
  let commentsService: CommentsService;
  let commentRepository: Repository<CommentEntity>;

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
    const commentsModule = module.select<CommentsModule>(CommentsModule);
    const dbModule = module.select<DatabaseModule>(DatabaseModule);
    connection = dbModule.get(MySQLConnectionToken);
    postsService = postModule.get<PostsService>(PostsService);
    commentsService = commentsModule.get<CommentsService>(CommentsService);
    // hacks...
    // tslint:disable-next-line
    postRepository = postsService['postRepository'];
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

  describe('/tag/:name', () => {
    it('should return posts when there is no query param for comments', async () => {
      const tagName = dbContent.dbTags[0].name;
      const { body } = await request(server)
        .get(`/${prefix}/tag/${tagName}`)
        .expect(200);

      const dbPosts = await postRepository
        .createQueryBuilder('post')
        .leftJoinAndSelect('post.tags', 'tags')
        .where('tags.name = :name', { name: tagName })
        .take(10)
        .skip(0)
        .getMany();

      expect(body.data).toHaveLength(10);
      expect(body.data[0].content).toEqual(dbPosts[0].content);
      expect(body.meta.count).toBe(15);
      expect(body.meta.page).toBe(1);
      expect(body.meta.pages).toBe(2);
      expect(body.meta.tag.name).toBe(tagName);
      expect(body.meta.content).toBe('posts');
    });

    it('should return comments when there is query param for comments', async () => {
      const tagName = dbContent.dbTags[0].name;
      const { body } = await request(server)
        .get(`/${prefix}/tag/${tagName}?content=comments`)
        .expect(200);

      const dbComments = await commentRepository
      .createQueryBuilder('comment')
        .leftJoinAndSelect('comment.tags', 'tags')
        .where('tags.name = :name', { name: tagName })
        .take(10)
        .skip(0)
        .getMany();

      expect(body.data).toHaveLength(10);
      expect(body.data[0].content).toEqual(dbComments[0].content);
      expect(body.meta.count).toBe(15);
      expect(body.meta.page).toBe(1);
      expect(body.meta.pages).toBe(2);
      expect(body.meta.tag.name).toBe(tagName);
      expect(body.meta.content).toBe('comments');
    });
  });
});