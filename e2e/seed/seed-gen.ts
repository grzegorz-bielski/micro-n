import * as crypto from 'crypto';
import * as faker from 'faker';
import * as _ from 'lodash';
import { Connection, Repository } from 'typeorm';

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
  VotesGenerator,
} from './seed-interfaces';

// util
import { saveImage } from '../../src/modules/common/util/files';
import { CommentVoteEntity } from '../../src/modules/comments/entities/comment-vote.entity';
import { PostVoteEntity } from '../../src/modules/posts/entities/post-vote.entity';

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
  dbPostsVotes: {
    posts: [0],
  },
  dbCommentsVotes: {
    comments: [0],
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

const genereteAndCreateVotes = (data: VotesGenerator): any[] => {
  const votes: any[] = [];
  data.msgs.forEach(msg => {
    votes.push(Object.assign(new data.Entity(), {
      user: data.user, [data.type]: msg,
    }));
  });
  return votes;
};

export async function flushDb(connection: Connection): Promise<void> {
  const deleteQuery = connection.manager.createQueryBuilder().delete();

  // flushing actions should be in order!

  // 1. comments & posts relations
  await Promise.all([
    deleteQuery.from('tag_entity_comments_comment_entity').execute(),
    deleteQuery.from(CommentImageEntity).execute(),
    deleteQuery.from(CommentVoteEntity).execute(),
    deleteQuery.from('tag_entity_posts_post_entity').execute(),
    deleteQuery.from(PostImageEntity).execute(),
    deleteQuery.from(PostVoteEntity).execute(),
  ]);
  // 2. comments
  await deleteQuery.from(CommentEntity).execute();
  // 3. posts
  await deleteQuery.from(PostEntity).execute();
  // 4. tags & users
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
  const postVoteRepository = connection.getRepository(PostVoteEntity);
  const commentRepository = connection.getRepository(CommentEntity);
  const commentVoteRepository = connection.getRepository(CommentVoteEntity);
  const tagRepository = connection.getRepository(TagEntity);

  // user
  let users: User[];
  let userEntities: UserEntity[];
  if (config.dbUsers) {
    users = generateUsers(config.dbUsers);
    userEntities = await userRepository.save(
      users.map(user => Object.assign(new UserEntity(), user)),
    );
  }

  // tags
  let tagEntities: TagEntity[];
  if (config.dbTags) {
    tagEntities = await tagRepository.save(
      generateAndCreateTags(config.dbTags),
    );
  }

  // posts
  let postEntities: PostEntity[];
  if (config.dbPosts) {
    postEntities = await postRepository.save(
      userEntities
        .map(user => generateAndCreatePosts(Object.assign(config.dbPosts, { user, tags: tagEntities })))
        .reduce((a, b) => a.concat(b)),
    );
  }

  // posts' votes
  let postVotesEntities: PostVoteEntity[];
  if (config.dbPostsVotes) {
    postVotesEntities = await postVoteRepository.save(
      userEntities
        .map(user => genereteAndCreateVotes({
          user,
          type: 'post',
          Entity: PostVoteEntity,
          msgs: postEntities
            .filter((__, index) => index === config.dbPostsVotes.posts
              .find(postId => postId === index)),
        }))
        .reduce((a, b) => a.concat(b)),
    );
  }

  // comments
  let commentEntities: CommentEntity[];
  if (config.dbComments) {
    commentEntities = await commentRepository.save(
      _.flattenDeep(userEntities
        .map(user => {
          const userComments = [];
          config.dbComments.posts.forEach(post => userComments.push(generateAndCreateComments({
            user,
            tags: tagEntities,
            numberOf: config.dbComments.numberOf,
            withImages: config.dbComments.withImages,
            post: postEntities[post],
          })));
          return userComments;
        })),
    );
  }

  // comments' votes
  let commentVotesEntities: CommentVoteEntity[];
  if (config.dbCommentsVotes) {
    commentVotesEntities = await commentVoteRepository.save(
      userEntities
        .map(user => genereteAndCreateVotes({
          user,
          type: 'comment',
          Entity: CommentVoteEntity,
          msgs: commentEntities
            .filter((__, index) => index === config.dbCommentsVotes.comments
              .find(commentId => commentId === index)),
        }))
        .reduce((a, b) => a.concat(b)),
    );
  }

  return {
    generatedUsers: users,
    dbUsers: userEntities,
    dbPosts: postEntities,
    dbComments: commentEntities,
    dbTags: tagEntities,
    dbPostsVotes: postVotesEntities,
    dbCommentsVotes: commentVotesEntities,
  };
}
