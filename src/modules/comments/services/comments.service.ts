import {
  Component,
  Inject,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { Repository } from 'typeorm';

import { UserEntity } from '../../users/entities/user.entity';
import { TagEntity } from '../../tags/entities/tag.entity';
import { PostEntity } from '../../posts/entities/post.entity';
import { CommentEntity } from '../entities/comment.entity';
import { CommentImageEntity } from '../entities/comment-image.entity';
import { TagsService } from '../../tags/services/tags.service';
import { MsgImageService } from '../../common/services/msg-image.service';
import {
  CommentRepositoryToken,
  CommentImageRepositoryToken,
  UserRepositoryToken,
  PostRepositoryToken,
  CommentsVotesRepositoryToken,
} from '../../constants';
import {
  saveImage,
  deleteImage,
} from '../../common/util/files';
import { Image } from '../../common/interfaces/image.interface';
import { OnModuleInit } from '@nestjs/common/interfaces';
import { CommentVoteEntity } from '../entities/comment-vote.entity';
import { IVoteConfig, MsgVoteService, IVote } from '../../common/services/msg-vote.service';
import { MsgPaginationData, MsgPaginationService } from '../../common/services/msg-pagination.service';

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

interface GetComments extends MsgPaginationData {
  postId: number;
}

@Component()
export class CommentsService implements OnModuleInit {
  private voteConfig: IVoteConfig;

  constructor(
    @Inject(CommentRepositoryToken)
    private readonly commentRepository: Repository<CommentEntity>,
    @Inject(PostRepositoryToken)
    private readonly postRepository: Repository<PostEntity>,
    @Inject(UserRepositoryToken)
    private readonly userRepository: Repository<UserEntity>,
    @Inject(CommentImageRepositoryToken)
    private readonly commentImageRepository: Repository<CommentImageEntity>,
    @Inject(CommentsVotesRepositoryToken)
    private readonly commentVoteRepository: Repository<CommentVoteEntity>,

    private readonly tagsService: TagsService,
    private readonly imageService: MsgImageService,
    private readonly voteService: MsgVoteService,
    private readonly paginationService: MsgPaginationService,
  ) {}

  public onModuleInit() {
    this.voteConfig = {
      Entity: CommentVoteEntity,
      type: 'comment',
      userRepo: this.userRepository,
      msgRepo: this.commentRepository,
      msgVoteRepo: this.commentVoteRepository,
    };
  }

  public async getComments(data: GetComments) {
    return this.paginationService.getMsgs(data, {
      type: 'comment',
      relations: ['user', 'image', 'tags'],
      repo: this.commentRepository,
      where: [{ condition: 'comment.postId = :id', values: { id: data.postId } }],
    });
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

  public vote(voteData: IVote): Promise<void> {
    return this.voteService.createVote(voteData, this.voteConfig);
  }

  public unVote(voteData: IVote): Promise<void> {
    return this.voteService.deleteVote(voteData, this.voteConfig);
  }

  public async newComment(data: InewComment) {
    const [user, post] = await Promise.all([
      this.userRepository.findOneById(data.userId),
      this.postRepository.findOneById(data.postId),
    ]);
    const commentImage: Image = data.image;
    let commentData: object = { content: data.content, tags: data.tags, user, post };

    if (!user) {
      throw new HttpException('There is no such user', HttpStatus.NOT_FOUND);
    }
    if (!post) {
      throw new HttpException('There is no such post', HttpStatus.NOT_FOUND);
    }

    commentData = await this.imageService.persistImage(commentImage, commentData, CommentImageEntity);

    return this.commentRepository.save(Object.assign(new CommentEntity(), commentData));
  }

  public async updateComment(data: IupdateComment) {
    const oldComment = data.comment;
    const commentImage: Image = data.image;
    let commentData: object = { content: data.content, tags: data.tags };
    let isDirectLink: boolean = false;

    if (commentImage && oldComment.image) {
      // if there was image before
      if (oldComment.image.fileName && commentImage.fileName !== oldComment.image.fileName) {
        await deleteImage(oldComment.image.fileName);
      } else if (oldComment.image.directLink && commentImage.directLink !== oldComment.image.directLink) {
        isDirectLink = true;
      }
    }

    commentData = await this.imageService.persistImage(commentImage, commentData, CommentImageEntity);

    return this.commentRepository.save(
      Object.assign(oldComment, commentData, { directLink: isDirectLink ? commentImage.directLink : ''}),
    );
  }

  public async deleteComment(comment: CommentEntity) {
    // delete image & votes
    await Promise.all([
      this.imageService.deleteImage(comment.image, this.commentImageRepository),
      this.voteService.deleteAllVotes(comment.id, this.voteConfig),
    ]);

    // delete comment
    await this.commentRepository.remove(comment);
    // try deleting tags
    await this.tagsService.deleteTags(comment.tags);
  }

  public async deleteAllComments(postId: number) {
    const [ comments, count ] = await this.commentRepository.findAndCount({
      relations: ['user', 'image'],
      where: { postId },
    });

    if (comments && count > 0) {
      return Promise.all(comments.map(comment => this.deleteComment(comment)));
    }
  }

}