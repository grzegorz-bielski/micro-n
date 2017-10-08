import { IsString } from 'class-validator';

export class VerificationQueryDto {
  @IsString()
  readonly hash: string;
}
