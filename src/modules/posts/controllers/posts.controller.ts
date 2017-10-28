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
import { PostDto } from '../dto/Post.dto';
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
  public getPosts(): Promise<PostEntity[]> {
    return this.postsService.getPosts();
  }

  @Get('/:id')
  public getPost( @Param() params: { id: string } ): Promise<PostEntity> {
    return this.postsService.getPost(Number.parseInt(params.id));
  }

  @Post('/new')
  @Roles('user')
  public newPost(
    @Body() body: PostDto, @Request() req,
  ): Promise<PostEntity> {
     return this.postsService.newPost(req.user.id, body.content);
  }

  @Patch('/:id')
  @Roles('user')
  public updatePost(
    @Param() params: { id: string }, @Body() body, @Request() req,
  ): Promise<PostEntity> {
    return this.postsService.updatePost(req.user.id, Number.parseInt(params.id), body.content);
  }

  @Delete('/:id')
  @Roles('user')
  public deletePost(
    @Param() params: { id: string }, @Request() req,
  ): Promise<void> {
    return this.postsService.deletePost(req.user.id, Number.parseInt(params.id));
  }

}