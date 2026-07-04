import { IsString, Length, Matches } from 'class-validator';

export class VerifyTotpDto {
  @IsString()
  tempToken!: string;

  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/)
  code!: string;
}
