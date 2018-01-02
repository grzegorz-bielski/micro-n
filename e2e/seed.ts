import * as crypto from 'crypto';
import * as faker from 'faker';
import { Connection } from 'typeorm';

// entities
import { UserEntity } from '../src/modules/users/entities/user.entity';
import { TagEntity } from '../src/modules/tags/entities/tag.entity';
import { PostEntity } from '../src/modules/posts/entities/post.entity';
import { CommentEntity } from '../src/modules/comments/entities/comment.entity';
import { CommentImageEntity } from '../src/modules/comments/entities/comment-image.entity';
import { PostImageEntity } from '../src/modules/posts/entities/post-image.entity';

import { saveImage } from '../src/modules/common/util/files';
import { User } from '../src/modules/users/interfaces/user.interface';

interface SeedGenerator {
  numberOf: number;
}

interface PostGenerator extends SeedGenerator {
  user: UserEntity;
  tags?: TagEntity[];
}

interface CommentGenerator extends PostGenerator {
  post: PostEntity;
}

interface Entities {
  dbUsers: UserEntity[];
  dbPosts: PostEntity[];
  dbComments: CommentEntity[];
  dbTags: TagEntity[];
}

export interface DbContent extends Entities {
  generatedUsers: User[];
}

export const dummyImage = {
  // fileName: 'foo',
  directLink: 'http://www.kek.com/pictures/pic.jpg',
  isNsfw: false,
  // image: 'data:image/gif;base64,R0lGODlhAQABAIAAAP///////yH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==',
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
      image: i === 0 ? Object.assign(new PostImageEntity(), dummyImage) : void 0,
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
      image: i === 0 ? Object.assign( new CommentImageEntity(), dummyImage) : void 0,
    }));
  }
  return comments;
};

const generateUsers = ({ numberOf }: SeedGenerator): User[] => {
  const newUsers: User[] = [];
  for (let i = 0; i < numberOf; i++) {
    newUsers.push({
      name: faker.name.firstName(),
      email: faker.internet.email(),
      password: faker.internet.password(),
      isActive: i === 0 || i === 1 ? true : false,
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

export async function populateDb(connection: Connection): Promise<DbContent> {
  // repositories
  const userRepository = connection.getRepository(UserEntity);
  const postRepository = connection.getRepository(PostEntity);
  const commentRepository = connection.getRepository(CommentEntity);
  const tagRepository = connection.getRepository(TagEntity);

  // user
  const users: User[] = generateUsers({ numberOf: 3 });
  const usersEntity: UserEntity[] = await userRepository.save(
    users.map(user => Object.assign(new UserEntity(), user)),
  );

  // tags
  // const tagsEntityOne: TagEntity[] = generateAndCreateTags({ numberOf: 1 });
  const tagsEntityTwo: TagEntity[] = await tagRepository.save(
    generateAndCreateTags({ numberOf: 2 }),
  );

  // posts
  const postsEntity: PostEntity[] = await postRepository.save(
    usersEntity
      .map(user => generateAndCreatePosts({ user, numberOf: 5, tags: tagsEntityTwo }))
      .reduce((a, b) => a.concat(b)),
  );

  // comments
  const commentsEntity: CommentEntity[] = await commentRepository.save(
    usersEntity
      .map(user => generateAndCreateComments({user, numberOf: 5, post: postsEntity[0], tags: tagsEntityTwo }))
      .reduce((a, b) => a.concat(b)),
  );

  return {
    generatedUsers: users,
    dbUsers: usersEntity,
    dbPosts: postsEntity,
    dbComments: commentsEntity,
    dbTags: tagsEntityTwo,
  };
}
