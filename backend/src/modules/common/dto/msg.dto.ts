import {
  IsString,
  IsBase64,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

import { MsgImageDto } from './msg-image.dto';
import { MsgMetaDto } from './msg-meta.dto';

export class MsgDto {

  @IsString()
  readonly content: string;

  @ValidateNested()
  @IsOptional()
  @Type(() => MsgImageDto)
  readonly image?: MsgImageDto;

  @ValidateNested()
  @IsOptional()
  @Type(() => MsgMetaDto)
  readonly meta?: MsgMetaDto;
}