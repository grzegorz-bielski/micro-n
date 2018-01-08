import { UserEntity } from '../../src/modules/users/entities/user.entity';
import { TagEntity } from '../../src/modules/tags/entities/tag.entity';
import { PostEntity } from '../../src/modules/posts/entities/post.entity';
import { CommentEntity } from '../../src/modules/comments/entities/comment.entity';
import { CommentImageEntity } from '../../src/modules/comments/entities/comment-image.entity';
import { PostImageEntity } from '../../src/modules/posts/entities/post-image.entity';

import { User } from '../../src/modules/users/interfaces/user.interface';

// generators

export interface SeedGenerator {
  numberOf: number;
}

export interface UsersGenerator extends SeedGenerator {
  activeUsers: number[];
}

export interface PostGenerator extends SeedGenerator {
  user: UserEntity;
  withImages?: number[];
  tags?: TagEntity[];
}

export interface CommentGenerator extends PostGenerator {
  post: PostEntity;
}

export interface Entities {
  dbUsers: UserEntity[];
  dbPosts: PostEntity[];
  dbComments: CommentEntity[];
  dbTags: TagEntity[];
}

interface MsgGeneratorConfig extends SeedGenerator {
  withImages?: number[];
}

interface CommentsGeneratorConfig extends MsgGeneratorConfig {
  posts: number[];
}

export interface PopulateConfig {
  dbUsers?: UsersGenerator;
  dbPosts?: MsgGeneratorConfig;
  dbComments?: CommentsGeneratorConfig;
  dbTags?: SeedGenerator;
}

// all db content

export interface DbContent extends Entities {
  generatedUsers: User[];
}