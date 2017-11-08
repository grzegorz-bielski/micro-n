import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  AfterInsert,
  ManyToOne,
  OneToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { UserEntity } from '../../users/entities/user.entity';
import { PostImageEntity } from './post-image.entity';

@Entity()
export class PostEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @ManyToOne(type => UserEntity, userEntity => userEntity.posts)
  public user: UserEntity;

  @Column({ type: 'text' })
  public content: string;

  @OneToOne(type => PostImageEntity, postImageEntity => postImageEntity.post, {
    cascadeInsert: true,
    cascadeUpdate: true,
  })
  public image: PostImageEntity;

  // metadata

  @Column({ type: 'int', default: 0 })
  public score: number;

  @CreateDateColumn()
  public createdAt: string;

  @UpdateDateColumn()
  public updatedAt: string;

  // event listeners

  @AfterInsert()
  public addDefault() {
    if (!this.score) {
      this.score = 0;
    }
  }

}