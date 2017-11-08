import {
  IsString,
  IsBase64,
  IsOptional,
  ValidateNested,
} from 'class-validator';

import { PostImageDto } from './post-image.dto';

export class PostDto {

  @IsString()
  readonly content: string;

  @ValidateNested()
  @IsOptional()
  readonly image?: PostImageDto;

}
