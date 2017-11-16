import {
  IsOptional,
  IsNumberString,
} from 'class-validator';

export class PaginationDto {

  @IsNumberString()
  @IsOptional()
  readonly page?: string;

  @IsNumberString()
  @IsOptional()
  readonly limit?: string;

}
