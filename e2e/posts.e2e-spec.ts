import * as request from 'supertest';
import * as faker from 'faker';
import * as express from 'express';
import { Test } from '@nestjs/testing';
import { Repository } from 'typeorm';

import { setUpConfig } from '../src/config/configure';
import { configureApp } from '../src/server';
import { User } from '../src/modules/users/interfaces/user.interface';
import { UserEntity } from '../src/modules/users/entities/user.entity';
import { PostEntity } from '../src/modules/posts/entities/post.entity';
import { AuthModule } from '../src/modules/auth/auth.module';
import { UsersModule } from '../src/modules/users/users.module';
import { PostsModule } from '../src/modules/posts/posts.module';
import { PostsService } from '../src/modules/posts/services/posts.service';

// bigger timeout to populate db
jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000000;

describe('PostsModule', () => {
  const prefix = 'api';
  const server = express();
  let dbUsers: UserEntity[];
  let generatedUsers: User[];
  let dbPosts: PostEntity[];
  let postsService: PostsService;
  let userRepository: Repository<UserEntity>;
  let postRepository: Repository<PostEntity>;

  const flushDb = async (): Promise<void> => {
    await postRepository
      .createQueryBuilder('post')
      .delete()
      .from(PostEntity)
      .execute();

    await userRepository
      .createQueryBuilder('user')
      .delete()
      .from(UserEntity)
      .execute();

  };
  const populateDb = async (): Promise<{
    usersEntity: UserEntity[],
    postsEntity: PostEntity[],
    users: User[],
  }> => {
    const generateAndCreatePosts = (postUser: UserEntity, numberOf: number = 5): PostEntity[] => {
      const posts: PostEntity[] = [];
      for (let i = 0; i <= numberOf; i++) {
        posts.push(Object.assign(new PostEntity(), {
          content: faker.lorem.sentence(),
          user: postUser,
        }));
      }
      return posts;
    };
    const generateUsers = (numberOf: number = 5): User[] => {
      const newUsers: User[] = [];
      for (let i = 0; i < numberOf; i++) {
        newUsers.push({
          name: faker.name.firstName(),
          email: faker.internet.email(),
          password: faker.internet.password(),
          isActive: i === 0 ? true : false,
        });
      }
      return newUsers;
    };
    const users: User[] = generateUsers();
    const usersEntity: UserEntity[] = await userRepository.save(
      users.map(user => Object.assign(new UserEntity(), user)),
    );
    const postsEntity: PostEntity[] = await postRepository.save(
      usersEntity.map(user => generateAndCreatePosts(user)).reduce((a, b) => a.concat(b)),
    );

    return { usersEntity, postsEntity, users };
  };

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
    postsService = postModule.get<PostsService>(PostsService);
    // hacks...
    // tslint:disable-next-line
    userRepository = postsService['userRepository'];
    // tslint:disable-next-line
    postRepository = postsService['postRepository'];

  });

  beforeEach(async () => {
    await flushDb();
    const reply = await populateDb();
    dbUsers = reply.usersEntity;
    dbPosts = reply.postsEntity;
    generatedUsers = reply.users;
  });

  afterAll(async () => {
    await flushDb();
  });

  describe('GET /posts', () => {
    it('should return ann array of posts', async () => {
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
        .post(`/${prefix}/posts/new`)
        .send({ content: 'ewefwf' })
        .expect(403);

      expect(body.type).toBe('HttpException');
    });

    it('should throw HttpException for invalid access token', async () => {
      const { body } = await request(server)
        .post(`/${prefix}/posts/new`)
        .send({ content: 'ewefwf' })
        .set('x-auth', 'wfwfwefwefvvvvv434')
        .expect(401);

      expect(body.type).toBe('HttpException');
    });

    it('should create a new post for authorized user', async () => {
      const post = { content: 'ewefwf' };
      const { body: logInBody } = await request(server)
        .post(`/${prefix}/users/login`)
        .send({ email: generatedUsers[0].email, password: generatedUsers[0].password })
        .expect(200);

      const { body: newPostBody } = await request(server)
        .post(`/${prefix}/posts/new`)
        .send(post)
        .set('x-auth', logInBody.meta.accessToken)
        .set('x-refresh', logInBody.meta.refreshToken)
        .expect(201);

      expect(newPostBody.data.content).toBe(post.content);
    });

  });

});