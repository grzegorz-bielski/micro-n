import {
  Controller,
  UseGuards,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Request,
  UseInterceptors,
  HttpStatus,
} from '@nestjs/common';
import { HttpException } from '@nestjs/core';

import { CommentDto } from '../dto/comment.dto';
import { CommentEntity } from '../entities/comment.entity';
import { CommentsService } from '../services/comments.service';
import { SanitizationInterceptor } from '../../common/interceptors/content-sanitization.interceptor';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('comments')
@UseGuards(RolesGuard)
@UseInterceptors(SanitizationInterceptor)
export class CommentsController {
  constructor(
    private readonly commentsService: CommentsService,
  ) {}

  @Get('/:id')
  public async getComments(@Param() params: { id: string }) {
    const postId: number = Number.parseInt(params.id);

    return {
      data: await this.commentsService.getComments(postId),
    };
  }

  @Get('/:id')
  public async getComment(@Param() params: { id: string }) {
    const commentId: number = Number.parseInt(params.id);

    return {
      data: await this.commentsService.getComment(commentId),
    };
  }

  @Post('/new/:id')
  @Roles('user')
  public async newComment(
    @Param() params: { id: string },
    @Body() body: CommentDto,
    @Request() req,
  ) {
    return {
      data: await this.commentsService.newComment({
        userId: req.user.id,
        postId: Number.parseInt(params.id),
        content: body.content,
        image: body.image,
      }),
    };
  }

  @Patch('/:id')
  @Roles('user')
  public async updateComment(
    @Param() params: { id: string },
    @Body() body: CommentDto,
    @Request() req,
  ) {
    const comment: CommentEntity = await this.commentsService.getComment(Number.parseInt(params.id));

    if (comment.user.id !== req.user.id) {
      throw new HttpException('You can\'t update this comment', HttpStatus.FORBIDDEN);
    }

    return {
      data: await this.commentsService.updateComment({
        comment,
        content: body.content,
        image: body.image,
      }),
    };
  }

  @Delete('/:id')
  @Roles('user')
  public async deleteComment(@Param() params: { id: string }, @Request() req) {
    const comment: CommentEntity = await this.commentsService.getComment(Number.parseInt(params.id));

    if (comment.user.id !== req.user.id) {
      throw new HttpException('You can\'t delete this comment', HttpStatus.FORBIDDEN);
    }

    await this.commentsService.deleteComment(comment);
  }
}