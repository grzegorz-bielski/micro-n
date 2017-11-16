import {
  IsString,
  IsBase64,
  IsOptional,
  IsBoolean,
  ValidateIf,
  IsUrl,
} from 'class-validator';

export class ImageDto {
  @IsUrl()
  @IsOptional()
  public directLink?: string;

  // image upload

  @ValidateIf(obj => !!obj.directLink)
  @IsBase64()
  public image: string;

  @ValidateIf(obj => !!obj.directLink)
  @IsString()
  public fileName: string;

  // meta

  @IsBoolean()
  @IsOptional()
  public isNsfw?: boolean;
}