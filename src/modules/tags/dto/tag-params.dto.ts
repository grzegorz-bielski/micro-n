import { IsString } from 'class-validator';

export class TagParamsDto {

  @IsString()
  readonly name: string;
}