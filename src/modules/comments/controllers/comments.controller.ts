import {
  Controller,
  UseGuards,
  Get,
  Query,
  Param,
  UseInterceptors,
} from '@nestjs/common';

import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('comments')
// @UseGuards(RolesGuard)
// @UseInterceptors(SanitizationInterceptor)
export class CommentsController {
  constructor(
    // private readonly postsService: PostsService,
  ) {}

  @Get('/:id')
  public async getComments(@Param() params: { id: string }, @Query() query) {
    return `id: ${params.id}, query: ${JSON.stringify(query)}`;
    // dto query?
  }

  // @Post('/new')
  // @Roles('user')
  //
}