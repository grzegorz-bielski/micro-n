import {
  IsOptional,
  IsNumberString,
  IsArray,
} from 'class-validator';

export class MsgMetaDto {

  @IsArray()
  @IsOptional()
  readonly tags?: string[];

  @IsArray()
  @IsOptional()
  readonly mentions?: string[];

}