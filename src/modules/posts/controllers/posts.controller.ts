import {
  Controller,
  UseGuards,
  Post,
  Get,
  Param,
  Body,
  Patch,
  Delete,
  Request,
  UseInterceptors,
} from '@nestjs/common';

import { PostsService } from '../services/posts.service';
import { SanitizationInterceptor } from '../interceptors/sanitization.interceptor';
import { PostDto } from '../dto/post.dto';
import { PostEntity } from '../entities/post.entity';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ForbiddenException } from '../../common/exceptions/forbidden.exception';
import { NotFoundException } from '../../common/exceptions/notFound.exception';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('posts')
@UseGuards(RolesGuard)
@UseInterceptors(SanitizationInterceptor)
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
  ) {}

  @Get()
  public async getPosts() {
    return {
      data: await this.postsService.getPosts(),
    };
  }

  @Get('/:id')
  public async getPost(@Param() params: { id: string }) {
    return {
      data: await this.postsService.getPost(Number.parseInt(params.id)),
    };
  }

  @Post('/new')
  @Roles('user')
  public async newPost(@Body() body: PostDto, @Request() req) {
     return {
       data: await this.postsService.newPost({
         userId: req.user.id,
         content: body.content,
         image: body.image,
       }),
     };
  }

  @Patch('/:id')
  @Roles('user')
  public async updatePost(@Param() params: { id: string }, @Body() body, @Request() req) {
    return {
      data: await this.postsService.updatePost({
        userId: req.user.id,
        postId: Number.parseInt(params.id),
        content: body.content,
        image: body.image,
      }),
    };
  }

  @Delete('/:id')
  @Roles('user')
  public async deletePost(@Param() params: { id: string }, @Request() req) {
    await this.postsService.deletePost({
      userId: req.user.id,
      postId: Number.parseInt(params.id),
    });
  }

}