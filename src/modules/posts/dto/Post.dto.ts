import {
  IsString,
  IsBase64,
  IsOptional,
  ValidateNested,
} from 'class-validator';

import { ImageDto } from '../../common/dto/image.dto';

export class PostDto {

  @IsString()
  readonly content: string;

  @ValidateNested()
  @IsOptional()
  readonly image?: ImageDto;

}
