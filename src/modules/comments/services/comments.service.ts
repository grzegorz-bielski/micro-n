import { Component, Inject, HttpStatus } from '@nestjs/common';
import { HttpException } from '@nestjs/core';
import { Repository } from 'typeorm';

import { UserEntity } from '../../users/entities/user.entity';
import { PostEntity } from '../../posts/entities/post.entity';
import { CommentEntity } from '../entities/comment.entity';
import { CommentImageEntity } from '../entities/comment-image.entity';
import {
  CommentRepositoryToken,
  CommentImageRepositoryToken,
  UserRepositoryToken,
  PostRepositoryToken,
} from '../../constants';
import {
  saveImage,
  deleteImage,
} from '../../common/util/files';
import { Image } from '../../common/interfaces/image.interface';

interface IComment {
  content: string;
  image: Image;
}

interface InewComment extends IComment {
  userId: number;
  postId: number;
}

interface IupdateComment extends IComment {
  comment: CommentEntity;
}

@Component()
export class CommentsService {
  constructor(
    @Inject(CommentRepositoryToken)
    private readonly commentRepository: Repository<CommentEntity>,
    @Inject(PostRepositoryToken)
    private readonly postRepository: Repository<PostEntity>,
    @Inject(UserRepositoryToken)
    private readonly userRepository: Repository<UserEntity>,
    @Inject(CommentImageRepositoryToken)
    private readonly commentImageRepository: Repository<CommentImageEntity>,
  ) {}

  public async getComments(postId: number) {
    const comments: CommentEntity[] = await this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .leftJoinAndSelect('post.image', 'image')
      .where('comment.id = :id', { postId })
      .getMany();

    if (!comments || comments.length <= 0) {
      throw new HttpException('There is no comments for this post', HttpStatus.NOT_FOUND);
    }

    return comments;
  }

  public async getComment(commentId: number) {
    const comment: CommentEntity = await this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .leftJoinAndSelect('post.image', 'image')
      .where('comment.id = :id', { commentId })
      .getOne();

    if (!comment) {
      throw new HttpException('There is no such post', HttpStatus.NOT_FOUND);
    }

    return comment;
  }

  public async newComment(data: InewComment) {
    const [user, post] = await Promise.all([
      this.userRepository.findOneById(data.userId),
      this.postRepository.findOneById(data.postId),
    ]);
    const commentImage: Image = data.image;
    const commentData: any = { content: data.content, user, post };

    if (!user) {
      throw new HttpException('There is no such user', HttpStatus.NOT_FOUND);
    }
    if (!post) {
      throw new HttpException('There is no such post', HttpStatus.NOT_FOUND);
    }

    if (commentImage && commentImage.directLink) {
      // save only link
      delete commentImage.fileName;
      delete commentImage.image;
      commentData.image = Object.assign(new CommentImageEntity(), commentImage);
    } else if (commentImage && commentImage.image) {
       // image upload
      commentData.image = Object.assign(new CommentImageEntity(), commentImage, {
        // save image to public folder
        fileName: await saveImage(commentImage.image, commentImage.fileName),
      });
    }

    return this.commentRepository.save(Object.assign(new CommentEntity(), commentData));
  }

  public async updateComment(data: IupdateComment) {
    const oldComment = data.comment;
    const commentImage: Image = data.image;
    const commentData: any = { content: data.content };

    // update image
    if (commentImage && commentImage.fileName !== oldComment.image.fileName) {
      // delete old image and save new one to public folder
      const [_, fileName] = await Promise.all([
        deleteImage(oldComment.image.fileName),
        saveImage(commentImage.image, commentImage.fileName),
      ]);

      commentData.image = Object.assign(
        new CommentImageEntity(), commentImage, { fileName },
      );
    }

    return this.commentRepository.save(Object.assign(oldComment, commentData));
  }

  public async deleteComment(comment: CommentEntity) {

    // delete image
    if (comment.image && comment.image.directLink) {
      // delete from DB
      this.commentImageRepository.remove(comment.image);
    } else if (comment.image && comment.image.fileName) {
      // delete from DB and disk
      await Promise.all([
        deleteImage(comment.image.fileName),
        this.commentImageRepository.remove(comment.image),
      ]);
    }

    await this.commentRepository.remove(comment);
  }

  public async deleteAllComments() {
    ///
  }
}