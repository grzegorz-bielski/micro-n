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
  Query,
  UseInterceptors,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TagsService } from '../services/tags.service';

@Controller('tag')
@UseGuards(RolesGuard)
export class TagsController {
  constructor(
    private readonly tagsService: TagsService,
  ) {}

  @Get()
  public getTaggedContent() {
    return 'kek';
  }
}