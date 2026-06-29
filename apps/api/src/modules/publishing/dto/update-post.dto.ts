import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdatePostDto {
  @IsString()
  @IsOptional()
  @MaxLength(5000)
  caption?: string;

  @IsDateString()
  @IsOptional()
  scheduledAt?: string;

  @IsString({ each: true })
  @IsOptional()
  mediaUrls?: string[];
}
