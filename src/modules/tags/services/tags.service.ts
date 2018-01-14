import {
  Component,
  Inject,
  HttpStatus,
  HttpCode,
  HttpException,
} from '@nestjs/common';
import { Repository } from 'typeorm';

import {
  TagRepositoryToken,
  PostRepositoryToken,
  CommentRepositoryToken,
} from '../../constants';
import { TagEntity } from '../entities/tag.entity';
import { PostEntity } from '../../posts/entities/post.entity';
import { CommentEntity } from '../../comments/entities/comment.entity';

export interface GetTagContent {
  page: number;
  limit: number;
  name: string;
  content: string;
}

@Component()
export class TagsService {
  constructor(
    @Inject(PostRepositoryToken)
    private readonly postRepository: Repository<PostEntity>,
    @Inject(TagRepositoryToken)
    private readonly tagRepostiory: Repository<TagEntity>,
    @Inject(CommentRepositoryToken)
    private readonly commentRepostiory: Repository<CommentEntity>,
  ) {}

  public async createTags(tags: string[]): Promise<TagEntity[]> {
    const oldTags: TagEntity[] = (await Promise.all(
      tags.map(name => this.tagRepostiory.findOne({ name })),
    )).filter(tag => !!tag);

    const newTags: TagEntity[] = await this.tagRepostiory.save(
      tags.filter(name => !oldTags.find(oldTag => oldTag && oldTag.name === name))
        .map(name => Object.assign(new TagEntity(), { name })),
    );

    return [...oldTags, ...newTags];
  }

  public async deleteTags(tagsEntity: TagEntity[]): Promise<void> {
    await Promise.all(tagsEntity.map(tagEntity => this.deleteTag(tagEntity.name)));
  }

  public async deleteTag(name: string): Promise<void> {
    if (name) {
      const tag: TagEntity = await this.getTag(name, true, true);

      // delete if tag has no relations
      if (tag && (tag.posts.length <= 0 && tag.comments.length <= 0 )) {
        await this.tagRepostiory.remove(tag);
      }
    }
  }

  public async getTag(
    name: string,
    loadRelations: boolean = true,
    ignoreError: boolean = false,
  ): Promise<TagEntity> {
    const tag = await this.tagRepostiory.findOne({
      where: { name },
      relations: loadRelations ? ['posts', 'comments'] : void 0,
    });

    if (!tag && !ignoreError) {
      throw new HttpException('Tag not found', HttpStatus.NOT_FOUND);
    }

    return tag;
  }

  // get tag relations with pagination
  public async getTagContent({ page, limit, name, content}: GetTagContent) {
    const offset = (page - 1) * limit;
    const [ contentData, count ] = (
      content === 'comments'
        ? await this.getTagComments(name, limit, offset)
        : await this.getTagPosts(name, limit, offset)
    );

    return { contentData, count, pages: Math.ceil(count / limit) };
  }

  private getTagComments(name: string, limit: number, offset: number): Promise<[CommentEntity[], number]> {
    return this.commentRepostiory
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.tags', 'tags')
      .leftJoinAndSelect('comment.user', 'commentUsers')
      .leftJoinAndSelect('comment.image', 'commentImages')
      .where('tags.name = :name', { name })
      .take(limit)
      .skip(offset)
      .getManyAndCount();
  }

  private getTagPosts(name: string, limit: number, offset: number): Promise<[PostEntity[], number]> {
    return this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.tags', 'tags')
      .leftJoinAndSelect('post.user', 'postUsers')
      .leftJoinAndSelect('post.image', 'postImages')
      .where('tags.name = :name', { name })
      .take(limit)
      .skip(offset)
      .getManyAndCount();
  }

}