import { IsString, IsEmail, Validate } from 'class-validator';

export class SignUpUserDto {

  @IsString()
  readonly name: string;

  @IsEmail()
  readonly email: string;

  @IsString()
  readonly password: string;

  readonly roles: string[];

  @IsString()
  readonly description: string;

  // avatar
}