import {
  IsString,
  IsBase64,
  IsOptional,
  ValidateNested,
} from 'class-validator';

import { ImageDto } from '../../common/dto/image.dto';

export class CommentDto {

  @IsString()
  readonly content: string;

  @IsOptional()
  @ValidateNested()
  readonly image?: ImageDto;

}