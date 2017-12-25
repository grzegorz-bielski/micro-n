import {
  Controller,
  UseGuards,
  Get,
  Post,
  Query,
  Patch,
  Delete,
  Param,
  Body,
  Request,
  UseInterceptors,
  HttpStatus,
  HttpException,
} from '@nestjs/common';

import { MsgDto } from '../../common/dto/msg.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CommentEntity } from '../entities/comment.entity';
import { CommentsService } from '../services/comments.service';
import { TagsService } from '../../tags/services/tags.service';
import { SanitizationInterceptor } from '../../common/interceptors/content-sanitization.interceptor';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('comments')
@UseGuards(RolesGuard)
@UseInterceptors(SanitizationInterceptor)
export class CommentsController {
  constructor(
    private readonly commentsService: CommentsService,
    private readonly tagsService: TagsService,
  ) {}

  @Get('/post/:id')
  public async getComments(
    @Param() params: { id: string },
    @Query() query: PaginationDto,
  ) {
    const postId = Number.parseInt(params.id);
    const page = query && query.page ? Number.parseInt(query.page) : 1;
    let limit = query && query.limit ? Number.parseInt(query.limit) : 10;
    if (limit > 50) limit = 50;

    const { comments, count, pages } = await this.commentsService.getComments({ postId, page, limit });

    return { data: comments, meta: { count, pages } };

  }

  @Get('/:id')
  public async getComment(@Param() params: { id: string }) {
    const commentId: number = Number.parseInt(params.id);

    return {
      data: await this.commentsService.getComment(commentId),
    };
  }

  @Post('/post/:id')
  @Roles('user')
  public async newComment(
    @Param() params: { id: string },
    @Body() body: MsgDto,
    @Request() req,
  ) {
    return {
      data: await this.commentsService.newComment({
        userId: req.user.id,
        postId: Number.parseInt(params.id),
        content: body.content,
        image: body.image,
        tags: body.meta.tags ? await this.tagsService.createTags(body.meta.tags) : void 0,
      }),
    };
  }

  @Patch('/:id')
  @Roles('user')
  public async updateComment(
    @Param() params: { id: string },
    @Body() body: MsgDto,
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
        tags: body.meta.tags ? await this.tagsService.createTags(body.meta.tags) : void 0,
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