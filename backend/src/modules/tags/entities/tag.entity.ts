import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  JoinTable,
  ManyToMany,
  RelationCount,
  CreateDateColumn,
} from 'typeorm';

import { PostEntity } from '../../posts/entities/post.entity';
import { CommentEntity } from '../../comments/entities/comment.entity';

@Entity()
export class TagEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @CreateDateColumn()
  public createdAt: string;

  @Column({ unique: true })
  public name: string;

  // counters //

  @RelationCount((tag: TagEntity) => tag.comments)
  public commentsCount: number;

  @RelationCount((tag: TagEntity) => tag.posts)
  public postsCount: number;

  // junction tables //

  // posts_tags
  @ManyToMany(type => PostEntity, postEntity => postEntity.tags)
  @JoinTable()
  public posts: PostEntity[];

  // comments_tags
  @ManyToMany(type => CommentEntity, commentEntity => commentEntity.tags)
  @JoinTable()
  public comments: CommentEntity[];
}