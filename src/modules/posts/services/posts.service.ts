import { Component, Inject, HttpStatus, HttpException } from '@nestjs/common';
import { Repository } from 'typeorm';

import {
  PostRepositoryToken,
  UserRepositoryToken,
  PostImageRepositoryToken,
  CommentRepositoryToken,
} from '../../constants';
import { saveImage, deleteImage } from '../../common/util/files';
import { UserEntity } from '../../users/entities/user.entity';
import { PostEntity } from '../entities/post.entity';
import { CommentsService } from '../../comments/services/comments.service';
import { TagsService } from '../../tags/services/tags.service';
import { PostImageEntity } from '../entities/post-image.entity';
import { Image } from '../../common/interfaces/image.interface';
import { TagEntity } from '../../tags/entities/tag.entity';

interface IPost {
  content: string;
  image: Image;
  tags?: TagEntity[];
}

interface InewPost extends IPost {
  userId: number;
}

interface IupdatePost extends IPost{
  post: PostEntity;
}

interface IdeletePost {
  userId: number;
  postId: number;
}

@Component()
export class PostsService {
  constructor(
    @Inject(PostRepositoryToken)
    private readonly postRepository: Repository<PostEntity>,
    @Inject(UserRepositoryToken)
    private readonly userRepository: Repository<UserEntity>,
    @Inject(PostImageRepositoryToken)
    private readonly postImageRepository: Repository<PostImageEntity>,

    private readonly commentsService: CommentsService,
    private readonly tagsService: TagsService,
  ) {}

  public async getPosts(page: number, limit: number) {
    const offset = (page - 1) * limit;
    const [ posts, count ] = await this.postRepository.findAndCount({
        relations: ['user', 'image', 'tags'],
        take: limit,
        skip: offset,
    });

    if (count <= 0 || posts.length <= 0) {
      throw new HttpException('There is no posts', HttpStatus.NOT_FOUND);
    }

    return { posts, count, pages: Math.ceil(count / limit) };
  }

  public async getPost(id: number): Promise<PostEntity> {
    const post: PostEntity = await this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .leftJoinAndSelect('post.image', 'image')
      .leftJoinAndSelect('post.tags', 'tags')
      .where('post.id = :id', { id })
      .getOne();

    if (!post) {
      throw new HttpException('There is no such post', HttpStatus.NOT_FOUND);
    }

    return post;
  }

  public async newPost(data: InewPost): Promise<PostEntity> {
    const user: UserEntity = await this.userRepository.findOneById(data.userId);
    let postData: object = { content: data.content, tags: data.tags, user };

    if (!user) {
      throw new HttpException('There is no such user', HttpStatus.NOT_FOUND);
    }
    postData = await this.persistImage(data.image, postData);

    return this.postRepository.save(Object.assign(new PostEntity(), postData));
  }

  public async updatePost(data: IupdatePost): Promise<PostEntity> {
    const oldPost = data.post;
    const postImage: Image = data.image;
    let postData: object = { content: data.content, tags: data.tags };
    let isDirectLink = false;

    if (postImage && oldPost.image) {
      // if there is new image and one before
      if (oldPost.image.fileName && postImage.fileName !== oldPost.image.fileName) {
        await deleteImage(oldPost.image.fileName);
      } else if (oldPost.image.directLink && postImage.directLink !== oldPost.image.directLink) {
        isDirectLink = true;
      }
    }
    postData = await this.persistImage(postImage, postData);

    return this.postRepository.save(
      Object.assign(oldPost, postData, { directLink: isDirectLink ? postImage.directLink : ''}),
    );
  }

  public async deletePost(post: PostEntity): Promise<void> {
    // delete image
    await this.deleteImage(post.image);
    // delete all comments along with thier images and tags (if possible)
    await this.commentsService.deleteAllComments(post.id);
    // delete post
    await this.postRepository.remove(post);
    // try deleting tags
    await this.tagsService.deleteTags(post.tags);
  }

  private deleteImage(postImage: PostImageEntity): Promise<[void, PostImageEntity]> {
    if (postImage && postImage.directLink) {
      // delete from DB
      this.postImageRepository.remove(postImage);
    } else if (postImage && postImage.fileName) {
      // delete from DB and disk
      return Promise.all([
        deleteImage(postImage.fileName),
        this.postImageRepository.remove(postImage),
      ]);
    }
  }

  private async persistImage(postImage: Image, postData: any): Promise<object> {
    if (postImage && postImage.directLink) {
      // save only link
      delete postImage.fileName;
      delete postImage.image;
      postData.image = Object.assign(new PostImageEntity(), postImage);
    } else if (postImage && postImage.image) {
       // image upload
      postData.image = Object.assign(new PostImageEntity(), postImage, {
        // save image to public folder
        fileName: await saveImage(postImage.image, postImage.fileName),
      });
    }
    return postData;
  }

}