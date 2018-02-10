import {
  Validate,
  IsString,
  IsOptional,
  IsBoolean,
  ValidateIf,
  IsUrl,
} from 'class-validator';
import { IsBase64Data } from '../constraints/isBase64-data.constraint';

export class MsgImageDto {
  @IsUrl()
  @IsOptional()
  public directLink?: string;

  // image upload

  @ValidateIf(obj => !obj.directLink)
  @Validate(IsBase64Data)
  public image: string;

  @ValidateIf(obj => !obj.directLink)
  @IsString()
  public fileName: string;

  // meta

  @IsBoolean()
  @IsOptional()
  public isNsfw?: boolean;
}