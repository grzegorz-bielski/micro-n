import { IsString, IsNumber } from 'class-validator';

export class AuthDto {

  @IsString()
  readonly refreshToken: string;

  @IsNumber()
  readonly id: number;

}
