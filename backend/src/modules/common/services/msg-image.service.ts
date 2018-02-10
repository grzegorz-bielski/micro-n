import { Component } from '@nestjs/common';
import { Repository } from 'typeorm';

import { CommentImageEntity } from '../../comments/entities/comment-image.entity';
import { PostImageEntity } from '../../posts/entities/post-image.entity';

import { Image } from '../../common/interfaces/image.interface';
import {
  saveImage,
  deleteImage,
} from '../../common/util/files';

export interface IMsgImageService {
  deleteImage(imageEntity: object, repository: Repository<object>): Promise<[void, object]>;
  persistImage(imageEntity: Image, data: object, Entity: any): Promise<object>;
}

@Component()
export class MsgImageService implements IMsgImageService {

  public async deleteImage(msgImageEntity: any, repository: Repository<object>): Promise<[void, object]> {
    if (msgImageEntity && msgImageEntity.directLink) {
      // delete from DB
      await repository.remove(msgImageEntity);
    } else if (msgImageEntity && msgImageEntity.fileName) {
      // delete from DB and disk
      return Promise.all([
        deleteImage(msgImageEntity.fileName),
        repository.remove(msgImageEntity),
      ]);
    }
  }

  public async persistImage(msgImage: Image, msgData: any, Entity: any): Promise<object> {
    if (msgImage && msgImage.directLink) {
      // save only link
      delete msgImage.fileName;
      delete msgImage.image;
      msgData.image = Object.assign(new Entity(), msgImage);
    } else if (msgImage && msgImage.image) {
       // image upload
      msgData.image = Object.assign(new Entity(), msgImage, {
        // save image to public folder
        fileName: await saveImage(msgImage.image, msgImage.fileName),
      });
    }
    return msgData;
  }
}