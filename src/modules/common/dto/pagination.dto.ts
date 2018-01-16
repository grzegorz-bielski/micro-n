import {
  IsOptional,
  IsString,
  IsNumberString,
  IsDateString,
  IsBooleanString,
  IsIn,
} from 'class-validator';

export class PaginationDto {

  @IsNumberString()
  @IsOptional()
  readonly page?: string;

  @IsNumberString()
  @IsOptional()
  readonly limit?: string;

  @IsOptional()
  @IsString()
  readonly content?: string;

  @IsOptional()
  @IsDateString()
  readonly newerThan?: string;

  @IsOptional()
  @IsIn(['true'])
  readonly top?: string;

  @IsOptional()
  @IsIn(['true'])
  readonly sort?: string;

}
