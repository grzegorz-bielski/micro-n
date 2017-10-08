import { IsString, IsEmail } from 'class-validator';

export class SignUpUserDto {

  @IsString()
  readonly name: string;

  @IsEmail()
  readonly email: string;

  @IsString()
  readonly password: string;

  @IsString()
  readonly description: string;
}
