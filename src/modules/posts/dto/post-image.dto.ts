import {
  IsString,
  IsBase64,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class PostImageDto {
  @IsString()
  public fileName: string;

  @IsBase64()
  public image: string;

  @IsBoolean()
  @IsOptional()
  public isNsfw?: boolean;
}