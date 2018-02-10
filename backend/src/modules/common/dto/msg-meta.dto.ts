import {
  IsOptional,
  IsNumberString,
  IsArray,
  ArrayNotEmpty,
  ArrayUnique,
  ArrayNotContains,
} from 'class-validator';

export class MsgMetaDto {

  @ArrayNotContains([''])
  @ArrayUnique()
  @ArrayNotEmpty()
  @IsOptional()
  readonly tags?: string[];

  @IsArray()
  @IsOptional()
  readonly mentions?: string[];

}