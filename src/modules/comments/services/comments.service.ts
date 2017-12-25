import { Component, Inject, HttpStatus, HttpException } from '@nestjs/common';
import { Repository } from 'typeorm';

import { UserEntity } from '../../users/entities/user.entity';
import { TagEntity } from '../../tags/entities/tag.entity';
import { PostEntity } from '../../posts/entities/post.entity';
import { CommentEntity } from '../entities/comment.entity';
import { CommentImageEntity } from '../entities/comment-image.entity';
import { TagsService } from '../../tags/services/tags.service';
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
  tags?: TagEntity[];
}

interface InewComment extends IComment {
  userId: number;
  postId: number;
}

interface IupdateComment extends IComment {
  comment: CommentEntity;
}

interface IComments {
  postId: number;
  page?: number;
  limit?: number;
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

    private readonly tagsService: TagsService,
  ) {}

  public async getComments(data: IComments, ignoreError: boolean = false) {
    const { page, limit } = data;
    const [ comments, count ] = await Promise.all([
      this.commentRepository.find({
        relations: ['user', 'image'],
        where: { postId: data.postId },
        take: limit ? limit : void 0,
        skip: (page || limit) ? (page - 1) * limit : void 0,
      }),
      this.commentRepository.count(),
    ]);

    if ((count <= 0 || comments.length <= 0) && !ignoreError) {
      throw new HttpException('There is no comments for this post', HttpStatus.NOT_FOUND);
    }

    return { comments, count, pages: Math.ceil(count / limit) };
  }

  public async getComment(commentId: number, ignoreError: boolean = false) {
    const comment: CommentEntity = await this.commentRepository.findOne({
      relations: ['user', 'image'],
      where: { id: commentId },
    });

    if (!comment && !ignoreError) {
      throw new HttpException('There is no such comment', HttpStatus.NOT_FOUND);
    }

    return comment;
  }

  public async newComment(data: InewComment) {
    const [user, post] = await Promise.all([
      this.userRepository.findOneById(data.userId),
      this.postRepository.findOneById(data.postId),
    ]);
    const commentImage: Image = data.image;
    let commentData: object = { content: data.content, user, post };

    if (!user) {
      throw new HttpException('There is no such user', HttpStatus.NOT_FOUND);
    }
    if (!post) {
      throw new HttpException('There is no such post', HttpStatus.NOT_FOUND);
    }

    commentData = await this.persistImage(commentImage, commentData);

    return this.commentRepository.save(Object.assign(new CommentEntity(), commentData));
  }

  public async updateComment(data: IupdateComment) {
    const oldComment = data.comment;
    const commentImage: Image = data.image;
    let commentData: object = { content: data.content };
    let isDirectLink: boolean = false;

    if (commentImage && oldComment.image) {
      // if there was image before
      if (oldComment.image.fileName && commentImage.fileName !== oldComment.image.fileName) {
        await deleteImage(oldComment.image.fileName);
      } else if (oldComment.image.directLink && commentImage.directLink !== oldComment.image.directLink) {
        isDirectLink = true;
      }
    }

    commentData = await this.persistImage(commentImage, commentData);

    return this.commentRepository.save(
      Object.assign(oldComment, commentData, { directLink: isDirectLink ? commentImage.directLink : ''}),
    );
  }

  public async deleteComment(comment: CommentEntity) {
    // delete image
    await this.deleteImage(comment.image);
    // delete comment
    await this.commentRepository.remove(comment);
    // try deleting tags
    await this.tagsService.deleteTags(comment.tags);
  }

  public async deleteAllComments(postId: number) {
    const { comments, count } = await this.getComments({ postId }, true);
    if (comments && count > 0) {
      return Promise.all(comments.map(comment => this.deleteComment(comment)));
    }
  }

  private deleteImage(commentImage: CommentImageEntity): Promise<[void, CommentImageEntity]> {
    if (commentImage && commentImage.directLink) {
      // delete from DB
      this.commentImageRepository.remove(commentImage);
    } else if (commentImage && commentImage.fileName) {
      // delete from DB and disk
      return Promise.all([
        deleteImage(commentImage.fileName),
        this.commentImageRepository.remove(commentImage),
      ]);
    }
  }

  private async persistImage(commentImage: Image, commentData: any): Promise<object> {
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
    return commentData;
  }
}