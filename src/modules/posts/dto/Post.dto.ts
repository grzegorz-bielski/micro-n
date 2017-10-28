import { IsString, IsEmail } from 'class-validator';

export class PostDto {

  @IsString()
  readonly content: string;

}
