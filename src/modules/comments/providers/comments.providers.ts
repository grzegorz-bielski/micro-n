import { Connection, Repository } from 'typeorm';

import {
  MySQLConnectionToken,
  UserRepositoryToken,
  PostRepositoryToken,
  CommentRepositoryToken,
  CommentImageRepositoryToken,
  CommentsVotesRepositoryToken,
} from '../../constants';
import { UserEntity } from '../../users/entities/user.entity';
import { PostEntity } from '../../posts/entities/post.entity';
import { CommentEntity } from '../entities/comment.entity';
import { CommentImageEntity } from '../entities/comment-image.entity';
import { CommentVoteEntity } from '../entities/comment-vote.entity';

export const commentsProviders = [
  {
    provide: CommentRepositoryToken,
    useFactory: (connection: Connection) => connection.getRepository(CommentEntity),
    inject: [ MySQLConnectionToken ],
  },
  {
    provide: CommentsVotesRepositoryToken,
    useFactory: (connection: Connection) => connection.getRepository(CommentVoteEntity),
    inject: [ MySQLConnectionToken ],
  },
  {
    provide: PostRepositoryToken,
    useFactory: (connection: Connection) => connection.getRepository(PostEntity),
    inject: [ MySQLConnectionToken ],
  },
  {
    provide: UserRepositoryToken,
    useFactory: (connection: Connection) => connection.getRepository(UserEntity),
    inject: [ MySQLConnectionToken ],
  },
  {
    provide: CommentImageRepositoryToken,
    useFactory: (connection: Connection) => connection.getRepository(CommentImageEntity),
    inject: [ MySQLConnectionToken ],
  },
];