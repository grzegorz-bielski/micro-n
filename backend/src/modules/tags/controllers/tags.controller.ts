import {
  Controller,
  UseGuards,
  Post,
  Get,
  Param,
  Body,
  Query,
  HttpStatus,
  HttpException,
  UseInterceptors,
} from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TagsService } from '../services/tags.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { TagParamsDto } from '../dto/tag-params.dto';
import { SanitizationInterceptor } from '../../common/interceptors/content-sanitization.interceptor';

@Controller('tag')
@UseGuards(RolesGuard)
@UseInterceptors(SanitizationInterceptor)
export class TagsController {
  constructor(
    private readonly tagsService: TagsService,
  ) {}

  @Get('/:name')
  public async getTaggedContent( @Param() { name }: TagParamsDto, @Query() query: PaginationDto ) {
    const content = query.content === 'comments' ? 'comment' : 'post';
    const page = query && query.page ? Number.parseInt(query.page) : 1;
    let limit = query && query.limit ? Number.parseInt(query.limit) : 10;
    if (limit > 50) limit = 50;

    const tag = await this.tagsService.getTag(name, false);
    const { [`${content}s`]: data, count, pages } = await this.tagsService.getTagContent({
      name,
      limit,
      page,
      newerThan: query.newerThan,
      sort: query.sort,
      top: query.top,
      content,
    });

    return { data, meta: { count, pages, page, tag, content: `${content}s`} };
  }

}