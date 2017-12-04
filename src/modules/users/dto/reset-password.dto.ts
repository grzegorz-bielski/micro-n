import { IsString, IsEmail } from 'class-validator';

export class ResetPasswordDto {

  @IsString()
  readonly newPassword: string;

  @IsString()
  readonly hash: string;

}
