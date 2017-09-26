import { IsString } from 'class-validator';

export class SignUpUserDto {
  @IsString()
  readonly name: string;

  @IsString()
  readonly email: string;

  @IsString()
  readonly password: string;

  readonly roles: string[];

  @IsString()
  readonly description: string;

  // avatar
}