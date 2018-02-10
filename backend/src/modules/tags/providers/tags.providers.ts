import { Connection, Repository } from 'typeorm';
import { TagEntity } from '../entities/tag.entity';
import { PostEntity } from '../../posts/entities/post.entity';
import { CommentEntity } from '../../comments/entities/comment.entity';
import {
  TagRepositoryToken,
  MySQLConnectionToken,
  PostRepositoryToken,
  CommentRepositoryToken,
} from '../../constants';

export const tagProviders = [
  {
    provide: TagRepositoryToken,
    useFactory: (connection: Connection) => connection.getRepository(TagEntity),
    inject: [ MySQLConnectionToken ],
  },
  {
    provide: PostRepositoryToken,
    useFactory: (connection: Connection) => connection.getRepository(PostEntity),
    inject: [ MySQLConnectionToken ],
  },
  {
    provide: CommentRepositoryToken,
    useFactory: (connection: Connection) => connection.getRepository(CommentEntity),
    inject: [ MySQLConnectionToken ],
  },
];