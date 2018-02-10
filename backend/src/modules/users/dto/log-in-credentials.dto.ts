import { IsString, IsEmail } from 'class-validator';

export class LogInCredentialsDto {

  @IsEmail()
  readonly email: string;

  @IsString()
  readonly password: string;

}
