import { Component, Inject, HttpStatus } from '@nestjs/common';
import { HttpException } from '@nestjs/core';
import { Repository } from 'typeorm';

import {
  PostRepositoryToken,
  UserRepositoryToken,
  PostImageRepositoryToken,
  CommentRepositoryToken,
} from '../../constants';
import { saveImage, deleteImage } from '../../common/util/files';
import { UserEntity } from '../../users/entities/user.entity';
import { PostEntity } from '../entities/post.entity';
import { CommentsService } from '../../comments/services/comments.service';
import { PostImageEntity } from '../entities/post-image.entity';
import { Image } from '../../common/interfaces/image.interface';

interface InewPost {
  userId: number;
  content: string;
  image: Image;
}

interface IdeletePost {
  userId: number;
  postId: number;
}

interface IupdatePost {
  image: Image;
  content: string;
  post: PostEntity;
}

@Component()
export class PostsService {
  constructor(
    @Inject(PostRepositoryToken)
    private readonly postRepository: Repository<PostEntity>,
    @Inject(UserRepositoryToken)
    private readonly userRepository: Repository<UserEntity>,
    @Inject(PostImageRepositoryToken)
    private readonly postImageRepository: Repository<PostImageEntity>,
    private readonly commentsService: CommentsService,
  ) {}

  public async getPosts(): Promise<PostEntity[]> {
    const posts: PostEntity[] = await this.postRepository
      .find({ relations: ['user', 'image'] });

    if (!posts || posts.length <= 0) {
      throw new HttpException('There is no posts', HttpStatus.NOT_FOUND);
    }

    return posts;
  }

  public async getPost(id: number): Promise<PostEntity> {
    const post: PostEntity = await this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .leftJoinAndSelect('post.comments', 'comments')
      .leftJoinAndSelect('post.image', 'image')
      .where('post.id = :id', { id })
      .getOne();

    if (!post) {
      throw new HttpException('There is no such post', HttpStatus.NOT_FOUND);
    }

    return post;
  }

  public async newPost(data: InewPost): Promise<PostEntity> {
    const user: UserEntity = await this.userRepository.findOneById(data.userId);
    const postImage: Image = data.image;
    const postData: any = { content: data.content, user };

    if (!user) {
      throw new HttpException('There is no such user', HttpStatus.NOT_FOUND);
    }

    if (postImage && postImage.directLink) {
      // save only link
      delete postImage.fileName;
      delete postImage.image;
      postData.image = Object.assign(new PostImageEntity(), postImage);
    } else if (postImage && postImage.image) {
       // image upload
      postData.image = Object.assign(new PostImageEntity(), postImage, {
        // save image to public folder
        fileName: await saveImage(postImage.image, postImage.fileName),
      });
    }

    return this.postRepository.save(Object.assign(new PostEntity(), postData));
  }

  public async updatePost(data: IupdatePost): Promise<PostEntity> {
    const oldPost = data.post;
    const postImage: Image = data.image;
    const postData: any = { content: data.content };

    // update image
    if (postImage && postImage.fileName !== oldPost.image.fileName) {
      // delete old image and save new one to public folder
      const [_, fileName] = await Promise.all([
        deleteImage(oldPost.image.fileName),
        saveImage(postImage.image, postImage.fileName),
      ]);
      postData.image = Object.assign(
        new PostImageEntity(), postImage, { fileName },
      );
    }

    return this.postRepository.save(Object.assign(oldPost, postData));
  }

  public async deletePost(post: PostEntity): Promise<void> {
    try {
      // delete image
      if (post.image && post.image.directLink) {
        // delete from DB
        this.postImageRepository.remove(post.image);
      } else if (post.image && post.image.fileName) {
        // delete from DB and disk
        await Promise.all([
          deleteImage(post.image.fileName),
          this.postImageRepository.remove(post.image),
        ]);
      }
      console.log('COMMENTOS', post.comments);
      // delete all comments with images
      if (post.comments) {
        // await this.commentsService.deleteAllComments(post)
        // await Promise.all(post.comments.map(comment => this.commentsService.deleteComment(comment)));
      }

      // delete post
      await this.postRepository.remove(post);
    } catch (error) {
      console.log(error);
    }
  }

}