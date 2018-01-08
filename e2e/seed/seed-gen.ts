import * as crypto from 'crypto';
import * as faker from 'faker';
import * as _ from 'lodash';
import { Connection } from 'typeorm';

// entities
import { UserEntity } from '../../src/modules/users/entities/user.entity';
import { TagEntity } from '../../src/modules/tags/entities/tag.entity';
import { PostEntity } from '../../src/modules/posts/entities/post.entity';
import { CommentEntity } from '../../src/modules/comments/entities/comment.entity';
import { CommentImageEntity } from '../../src/modules/comments/entities/comment-image.entity';
import { PostImageEntity } from '../../src/modules/posts/entities/post-image.entity';

// interfaces
import { User } from '../../src/modules/users/interfaces/user.interface';
import {
  PopulateConfig,
  SeedGenerator,
  UsersGenerator,
  PostGenerator,
  CommentGenerator,
  DbContent,
} from './seed-interfaces';

// util
import { saveImage } from '../../src/modules/common/util/files';

export const dummyImage = {
  // fileName: 'foo',
  directLink: 'http://www.kek.com/pictures/pic.jpg',
  isNsfw: false,
  // image: 'data:image/gif;base64,R0lGODlhAQABAIAAAP///////yH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==',
};

const defaultPopulateConfig: PopulateConfig = {
  dbUsers: {
    numberOf: 3,
    activeUsers: [0, 1],
  },
  dbPosts: {
    numberOf: 5,
    withImages: [0],
  },
  dbComments: {
    numberOf: 5,
    posts: [0],
    withImages: [0],
  },
  dbTags: {
    numberOf: 2,
  },
};

const generateAndCreateTags = ({ numberOf }: SeedGenerator): TagEntity[] => {
  const tags: TagEntity[] = [];
  for (let i = 0; i <= numberOf; i++) {
    tags.push(Object.assign(new TagEntity(), { name: faker.random.word() }));
  }
  return tags;
};

const generateAndCreatePosts = (data: PostGenerator): PostEntity[] => {
  const posts: PostEntity[] = [];
  for (let i = 0; i <= data.numberOf; i++) {
    posts.push(Object.assign(new PostEntity(), {
      user: data.user,
      tags: data.tags ? data.tags : void 0,
      content: faker.lorem.sentence(),
      image: i === data.withImages[i] ? Object.assign(new PostImageEntity(), dummyImage) : void 0,
    }));
  }
  return posts;
};

const generateAndCreateComments = (data: CommentGenerator): CommentEntity[] => {
  const comments: CommentEntity[] = [];
  for (let i = 0; i <= data.numberOf; i++) {
    comments.push(Object.assign(new CommentEntity(), {
      post: data.post,
      user: data.user,
      tags: data.tags ? data.tags : void 0,
      content: faker.lorem.sentence(),
      image: i === data.withImages[i] ? Object.assign( new CommentImageEntity(), dummyImage) : void 0,
    }));
  }
  return comments;
};

const generateUsers = (data: UsersGenerator): User[] => {
  const newUsers: User[] = [];
  for (let i = 0; i < data.numberOf; i++) {
    newUsers.push({
      name: faker.name.firstName(),
      email: faker.internet.email(),
      password: faker.internet.password(),
      isActive: i === data.activeUsers[i] ? true : false,
    });
  }
  return newUsers;
};

export async function flushDb(connection: Connection): Promise<void> {
  const deleteQuery = connection.manager.createQueryBuilder().delete();

  // flushing actions should be in order
  await Promise.all([
    deleteQuery.from('tag_entity_comments_comment_entity').execute(),
    deleteQuery.from('tag_entity_posts_post_entity').execute(),
    deleteQuery.from(CommentImageEntity).execute(),
    deleteQuery.from(PostImageEntity).execute(),
  ]);
  await deleteQuery.from(CommentEntity).execute();
  await deleteQuery.from(PostEntity).execute();
  await Promise.all([
    deleteQuery.from(TagEntity).execute(),
    deleteQuery.from(UserEntity).execute(),
  ]);

}

export async function populateDb(
  connection: Connection,
  config: PopulateConfig = defaultPopulateConfig,
): Promise<DbContent> {

  // repositories
  const userRepository = connection.getRepository(UserEntity);
  const postRepository = connection.getRepository(PostEntity);
  const commentRepository = connection.getRepository(CommentEntity);
  const tagRepository = connection.getRepository(TagEntity);

  // user
  let users: User[];
  let usersEntity: UserEntity[];
  if (config.dbUsers) {
    users = generateUsers(config.dbUsers);
    usersEntity = await userRepository.save(
      users.map(user => Object.assign(new UserEntity(), user)),
    );
  }

  // tags
  let tagsEntity: TagEntity[];
  if (config.dbTags) {
    tagsEntity = await tagRepository.save(
      generateAndCreateTags(config.dbTags),
    );
  }

  // posts
  let postsEntity: PostEntity[];
  if (config.dbPosts) {
    postsEntity = await postRepository.save(
      usersEntity
        .map(user => generateAndCreatePosts(Object.assign(config.dbPosts, { user, tags: tagsEntity })))
        .reduce((a, b) => a.concat(b)),
    );
  }

  // comments
  let commentsEntity: CommentEntity[];
  if (config.dbComments) {
    commentsEntity = await commentRepository.save(
      _.flattenDeep(usersEntity
        .map(user => {
          const userComments = [];
          config.dbComments.posts.forEach(post => userComments.push(generateAndCreateComments({
            user,
            tags: tagsEntity,
            numberOf: config.dbComments.numberOf,
            withImages: config.dbComments.withImages,
            post: postsEntity[post],
          })));
          return userComments;
        })),
    );
  }

  return {
    generatedUsers: users,
    dbUsers: usersEntity,
    dbPosts: postsEntity,
    dbComments: commentsEntity,
    dbTags: tagsEntity,
  };
}
