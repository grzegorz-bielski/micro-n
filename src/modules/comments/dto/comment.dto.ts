import {
  IsString,
  IsBase64,
  IsOptional,
  ValidateNested,
} from 'class-validator';

import { CommentImageDto } from './comment-image.dto';

export class CommentDto {

  @IsString()
  readonly content: string;

  @ValidateNested()
  @IsOptional()
  readonly image?: CommentImageDto;

}