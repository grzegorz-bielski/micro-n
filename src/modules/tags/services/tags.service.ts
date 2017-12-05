import { Component, Inject, HttpStatus } from '@nestjs/common';
import { HttpException } from '@nestjs/core';
import { Repository } from 'typeorm';

import { TagRepositoryToken } from '../../constants';
import { TagEntity } from '../entities/tag.entity';

@Component()
export class TagsService {
  constructor(
    @Inject(TagRepositoryToken)
    private readonly tagRepostiory: Repository<TagEntity>,
  ) {}

  public createTags(tags: string[]): Promise<TagEntity[]> {
    // TODO: check for duplicates
    return this.tagRepostiory.save(tags.map(name => Object.assign(new TagEntity(), { name })));
  }
}