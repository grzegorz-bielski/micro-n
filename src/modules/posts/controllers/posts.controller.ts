import {
  Controller,
  UseGuards,
  Post,
  Put,
  Get,
  Param,
  Body,
  Patch,
  Delete,
  Request,
  Query,
  UseInterceptors,
  HttpStatus,
  HttpException,
  HttpCode,
} from '@nestjs/common';

import { PostsService } from '../services/posts.service';
import { MsgDto } from '../../common/dto/msg.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PostEntity } from '../entities/post.entity';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SanitizationInterceptor } from '../../common/interceptors/content-sanitization.interceptor';
import { Roles } from '../../common/decorators/roles.decorator';
import { TagsService } from '../../tags/services/tags.service';

@Controller('posts')
@UseGuards(RolesGuard)
@UseInterceptors(SanitizationInterceptor)
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly tagsService: TagsService,
  ) {}

  @Get()
  public async getPosts(@Query() query: PaginationDto) {
    const page = query && query.page ? Number.parseInt(query.page) : 1;
    let limit = query && query.limit ? Number.parseInt(query.limit) : 10;
    if (limit > 50) limit = 50;

    const { posts, count, pages } = await this.postsService.getPosts(page, limit);

    return { data: posts, meta: { count, pages, page } };
  }

  @Get('/:id')
  public async getPost(@Param() params: { id: string }) {
    return {
      data: await this.postsService.getPost(Number.parseInt(params.id)),
    };
  }

  @Put('/vote/:id')
  @Roles('user')
  @HttpCode(201)
  public async vote(@Param() params: { id: string }, @Request() req) {
    await this.postsService.vote({
      userId: req.user.id,
      msgId: Number.parseInt(params.id),
    });
  }

  @Delete('/vote/:id')
  @Roles('user')
  public async unVote(@Param() params: { id: string }, @Request() req) {
    await this.postsService.unVote({
      userId: req.user.id,
      msgId: Number.parseInt(params.id),
    });
  }

  @Post()
  @Roles('user')
  public async newPost(@Body() body: MsgDto, @Request() req) {
    return {
      data: await this.postsService.newPost({
        userId: req.user.id,
        content: body.content,
        image: body.image,
        tags: (body.meta && body.meta.tags) ? await this.tagsService.createTags(body.meta.tags) : void 0,
      }),
    };
  }

  @Patch('/:id')
  @Roles('user')
  public async updatePost(
    @Param() params: { id: string },
    @Body() body: MsgDto,
    @Request() req,
  ) {
    const post: PostEntity = await this.postsService.getPost(Number.parseInt(params.id));

    if (post.user.id !== req.user.id) {
      throw new HttpException('You can\'t update this post', HttpStatus.FORBIDDEN);
    }

    return {
      data: await this.postsService.updatePost({
        post,
        content: body.content,
        image: body.image,
        tags: (body.meta && body.meta.tags) ? await this.tagsService.createTags(body.meta.tags) : void 0,
      }),
    };
  }

  @Delete('/:id')
  @Roles('user')
  public async deletePost(@Param() params: { id: string }, @Request() req) {
    const post: PostEntity = await this.postsService.getPost(Number.parseInt(params.id));

    if (post.user.id !== req.user.id) {
      throw new HttpException('You can\'t delete this post', HttpStatus.FORBIDDEN);
    }

    await this.postsService.deletePost(post);
  }

}