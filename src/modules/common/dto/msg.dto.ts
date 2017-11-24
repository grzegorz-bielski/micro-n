import {
  IsString,
  IsBase64,
  IsOptional,
  ValidateNested,
} from 'class-validator';

import { MsgImageDto } from './msg-image.dto';
import { MsgMetaDto } from './msg-meta.dto';

export class MsgDto {

  @IsString()
  readonly content: string;

  @ValidateNested()
  @IsOptional()
  readonly image?: MsgImageDto;

  @ValidateNested()
  @IsOptional()
  readonly meta?: MsgMetaDto;
}