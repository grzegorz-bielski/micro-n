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

  public async createTags(tags: string[]): Promise<TagEntity[]> {
    const oldTags: TagEntity[] = await Promise.all(
      tags.map(name => this.tagRepostiory.findOne({ name })),
    );
    const newTags: TagEntity[] = await this.tagRepostiory.save(
      tags.filter(name => !oldTags.find(oldTag => oldTag.name === name))
        .map(name => Object.assign(new TagEntity(), { name })),
    );

    return [...oldTags, ...newTags];
  }

  public async deleteTags(tagsEntity: TagEntity[]): Promise<void> {
    await tagsEntity.forEach(tagEntity => this.deleteTag(tagEntity.name));
  }

  public async deleteTag(name: string): Promise<void> {
    const tag: TagEntity = await this.tagRepostiory.findOne({
      where: { name },
      relations: ['posts', 'comments'],
    });

    // delete if tag has no relations anymore
    if (tag.posts.length <= 0 || tag.comments.length <= 0 ) {
      await this.tagRepostiory.remove(tag);
    }
  }
}