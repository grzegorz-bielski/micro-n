import { IsString, IsEmail, IsOptional } from 'class-validator';

export class SignUpUserDto {

  @IsString()
  readonly name: string;

  @IsEmail()
  readonly email: string;

  @IsString()
  readonly password: string;

  @IsOptional()
  @IsString()
  readonly description: string;
}
