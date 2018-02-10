import { Connection, Repository } from 'typeorm';
import { PostEntity } from '../entities/post.entity';
import { PostImageEntity } from '../entities/post-image.entity';
import { PostVoteEntity } from '../entities/post-vote.entity';
import { UserEntity } from '../../users/entities/user.entity';
import {
  PostRepositoryToken,
  UserRepositoryToken,
  MySQLConnectionToken,
  PostImageRepositoryToken,
  CommentRepositoryToken,
  PostVotesRepositoryToken,
} from '../../constants';

export const postProviders = [
  {
    provide: PostRepositoryToken,
    useFactory: (connection: Connection) => connection.getRepository(PostEntity),
    inject: [ MySQLConnectionToken ],
  },
  {
    provide: PostVotesRepositoryToken,
    useFactory: (connection: Connection) => connection.getRepository(PostVoteEntity),
    inject: [ MySQLConnectionToken ],
  },
  {
    provide: UserRepositoryToken,
    useFactory: (connection: Connection) => connection.getRepository(UserEntity),
    inject: [ MySQLConnectionToken ],
  },
  {
    provide: PostImageRepositoryToken,
    useFactory: (connection: Connection) => connection.getRepository(PostImageEntity),
    inject: [ MySQLConnectionToken ],
  },
];