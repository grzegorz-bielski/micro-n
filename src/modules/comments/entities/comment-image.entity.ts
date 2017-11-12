import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { CommentEntity } from './comment.entity';

@Entity()
export class CommentImageEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ nullable: true })
  public fileName: string;

  @Column({ nullable: true })
  public directLink: string;

  @OneToOne(type => CommentEntity, commentEntity => commentEntity.image, { eager: true })
  @JoinColumn()
  public post: CommentEntity;

  // meta

  @Column({ default: false })
  public isNsfw: boolean;

  @CreateDateColumn()
  public createdAt: string;

  @UpdateDateColumn()
  public updatedAt: string;
}