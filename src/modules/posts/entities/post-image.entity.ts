import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { PostEntity } from './post.entity';

@Entity()
export class PostImageEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public fileName: string;

  @OneToOne(type => PostEntity, postEntity => postEntity.image)
  @JoinColumn()
  public post: PostEntity;

  // meta

  @Column({ default: false })
  public isNsfw: boolean;

  @CreateDateColumn()
  public createdAt: string;

  @UpdateDateColumn()
  public updatedAt: string;
}