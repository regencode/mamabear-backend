import { IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  password: string;
}
