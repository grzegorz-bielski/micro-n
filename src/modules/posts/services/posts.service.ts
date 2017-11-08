import { Component, Inject, HttpStatus } from '@nestjs/common';
import { HttpException } from '@nestjs/core';
import { Repository } from 'typeorm';

import {
  PostRepositoryToken,
  UserRepositoryToken,
  PostImageRepositoryToken,
} from '../../constants';
import { saveImage, deleteImage } from '../../common/util/files';
import { UserEntity } from '../../users/entities/user.entity';
import { PostEntity } from '../entities/post.entity';
import { PostImageEntity } from '../entities/post-image.entity';
import { PostImage } from '../interfaces/post-image.interface';

interface InewPost {
  userId: number;
  content: string;
  image: PostImage;
}

interface IdeletePost {
  userId: number;
  postId: number;
}

interface IupdatePost extends InewPost, IdeletePost {}

@Component()
export class PostsService {
  constructor(
    @Inject(PostRepositoryToken)
    private readonly postRepository: Repository<PostEntity>,
    @Inject(UserRepositoryToken)
    private readonly userRepository: Repository<UserEntity>,
    @Inject(PostImageRepositoryToken)
    private readonly postImageRepository: Repository<PostImageEntity>,
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

  public async newPost(data: InewPost): Promise<PostEntity> {
    const user: UserEntity = await this.userRepository.findOneById(data.userId);
    const postImage: PostImage = data.image;
    const postData: any = { content: data.content, user };

    if (!user) {
      throw new HttpException('There is no such user', HttpStatus.NOT_FOUND);
    }

    if (postImage) {
      postData.image = Object.assign(new PostImageEntity(), postImage, {
        // save image to public folder
        fileName: await saveImage(postImage.image, postImage.fileName),
      });
    }

    return this.postRepository.save(Object.assign(new PostEntity(), postData));
  }

  public async updatePost(data: IupdatePost): Promise<PostEntity> {
    const oldPost: PostEntity = await this.getPost(data.postId);
    const postImage: PostImage = data.image;
    const postData: any = { content: data.content };

    if (!oldPost) {
      throw new HttpException('There is no such post', HttpStatus.NOT_FOUND);
    }

    if (oldPost.user.id !== data.userId) {
      throw new HttpException('You can\'t update this post', HttpStatus.FORBIDDEN);
    }

    if (postImage && postImage.fileName !== oldPost.image.fileName) {
      // delete old image and save new one to public folder
      const response = await Promise.all([
        deleteImage(oldPost.image.fileName),
        saveImage(postImage.image, postImage.fileName),
      ]);

      postData.image = Object.assign(
        new PostImageEntity(), postImage, { fileName: response[1] },
      );
    }

    return this.postRepository.save(
      Object.assign(oldPost, postData),
    );
  }

  public async deletePost(data: IdeletePost): Promise<void> {
    const post: PostEntity = await this.getPost(data.postId);

    if (!post) {
      throw new HttpException('There is no such post', HttpStatus.NOT_FOUND);
    }

    if (post.user.id !== data.userId) {
      throw new HttpException('You can\'t delete this post', HttpStatus.FORBIDDEN);
    }

    if (post.image) {
      await Promise.all([
        deleteImage(post.image.fileName),
        this.postImageRepository.remove(post.image),
      ]);
    }

    await this.postRepository.remove(post);
  }

}