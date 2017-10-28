import { Component, Inject, HttpStatus } from '@nestjs/common';
import { HttpException } from '@nestjs/core';
import { Repository } from 'typeorm';

import { UserEntity } from '../../users/entities/user.entity';
import { PostEntity } from '../entities/post.entity';
import { PostRepositoryToken, UserRepositoryToken } from '../../constants';
// import { Post } from '../interfaces/posts.interface';

@Component()
export class PostsService {
  constructor(
    @Inject(PostRepositoryToken)
    private readonly postRepository: Repository<PostEntity>,
    @Inject(UserRepositoryToken)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  public async getPosts(): Promise<PostEntity[]> {
    const posts: PostEntity[] = await this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .getMany();

    if (!posts || posts.length <= 0) {
      throw new HttpException('There is no posts', HttpStatus.NOT_FOUND);
    }

    return posts;
  }

  public async getPost(id: number): Promise<PostEntity> {
    const post: PostEntity = await this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .where('post.id = :id', { id })
      .getOne();

    if (!post) {
      throw new HttpException('There is no such post', HttpStatus.NOT_FOUND);
    }

    return post;
  }

  public async newPost(id: number, content: string): Promise<PostEntity> {
    const user: UserEntity = await this.userRepository.findOneById(id);

    if (!user) {
      throw new HttpException('There is no such user', HttpStatus.NOT_FOUND);
    }

    return this.postRepository.save(
      Object.assign(new PostEntity(), { content, user }),
    );
  }

  public async updatePost(userId: number, postId: number, content: string): Promise<PostEntity> {
    const post: PostEntity = await this.getPost(postId);

    if (post.user.id !== userId) {
      throw new HttpException('You can\'t update this post', HttpStatus.FORBIDDEN);
    }

    return this.postRepository.save(
      Object.assign(post, { content }),
    );
  }

  public async deletePost(userId: number, postId: number): Promise<void> {
    const post: PostEntity = await this.getPost(postId);

    if (post.user.id !== userId) {
      throw new HttpException('You can\'t delete this post', HttpStatus.FORBIDDEN);
    }

    this.userRepository
      .createQueryBuilder('post')
      .delete()
      .from(PostEntity)
      .where('id = :id', { id: postId})
      .execute();
  }

}