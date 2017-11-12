import * as crypto from 'crypto';
import * as faker from 'faker';
import { Repository, Connection, EntityManager } from 'typeorm';

import { saveImage } from '../src/modules/common/util/files';
import { User } from '../src/modules/users/interfaces/user.interface';
import { UserEntity } from '../src/modules/users/entities/user.entity';
import { PostEntity } from '../src/modules/posts/entities/post.entity';
import { CommentEntity } from '../src/modules/comments/entities/comment.entity';
import { CommentImageEntity } from '../src/modules/comments/entities/comment-image.entity';
import { PostImageEntity } from '../src/modules/posts/entities/post-image.entity';

interface DbContent {
  usersEntity: UserEntity[];
  postsEntity: PostEntity[];
  commentsEntity: CommentEntity[];
  users: User[];
}

export const dummyImage = {
  // fileName: 'foo',
  directLink: 'http://www.kek.com/pictures/pic.jpg',
  isNsfw: false,
  // image: 'data:image/gif;base64,R0lGODlhAQABAIAAAP///////yH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==',
};

const generateAndCreatePosts = (postUser: UserEntity, numberOf: number = 5): PostEntity[] => {
  const posts: PostEntity[] = [];
  for (let i = 0; i <= numberOf; i++) {
    posts.push(Object.assign(new PostEntity(), {
      content: faker.lorem.sentence(),
      user: postUser,
      image: i === 0 ? Object.assign(new PostImageEntity(), dummyImage) : void 0,
    }));
  }
  return posts;
};

const generateAndCreateComments = (post: PostEntity, commentUser: UserEntity, numberOf: number = 2): CommentEntity[] => {
  const comments: CommentEntity[] = [];
  for (let i = 0; i <= numberOf; i++) {
    comments.push(Object.assign(new CommentEntity(), {
      post,
      content: faker.lorem.sentence(),
      user: commentUser,
      image: i === 0 ? Object.assign( new CommentImageEntity(), dummyImage) : void 0,
    }));
  }
  return comments;
};

const generateUsers = (numberOf: number = 5): User[] => {
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

  // flushing actions should be in order:
  //
  // 1. comments images
  await deleteQuery.from(CommentImageEntity).execute();
  // 2. comments
  await deleteQuery.from(CommentEntity).execute();
  // 3. post images
  await deleteQuery.from(PostImageEntity).execute();
  // 4. posts
  await deleteQuery.from(PostEntity).execute();
  // 5. users
  await deleteQuery.from(UserEntity).execute();
}

export async function populateDb(connection: Connection): Promise<DbContent> {
  // repositories
  const userRepository = connection.getRepository(UserEntity);
  const postRepository = connection.getRepository(PostEntity);
  const commentRepository = connection.getRepository(CommentEntity);

  const users: User[] = generateUsers();
  const usersEntity: UserEntity[] = await userRepository.save(
    users.map(user => Object.assign(new UserEntity(), user)),
  );
  const postsEntity: PostEntity[] = await postRepository.save(
    usersEntity.map(user => generateAndCreatePosts(user)).reduce((a, b) => a.concat(b)),
  );
  const commentsEntity: CommentEntity[] = await commentRepository.save(
    generateAndCreateComments(postsEntity[0], usersEntity[0]),
  );

  return { usersEntity, postsEntity, commentsEntity, users };
}
