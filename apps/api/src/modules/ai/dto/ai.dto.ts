import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class SummarizeDto {
  @IsString()
  conversationId!: string;
}

export class RewriteDto {
  @IsString()
  @MaxLength(5000)
  text!: string;

  @IsString()
  @IsOptional()
  brandVoiceId?: string;
}

export class TranslateDto {
  @IsString()
  @MaxLength(5000)
  text!: string;

  @IsString()
  targetLanguage!: string;
}

export class HashtagsDto {
  @IsString()
  @MaxLength(3000)
  caption!: string;

  @IsString()
  platform!: string;
}

export class OptimizeDto {
  @IsString()
  @MaxLength(5000)
  caption!: string;

  @IsString()
  platform!: string;
}

export class CreateBrandVoiceDto {
  @IsString()
  name!: string;

  @IsString()
  tone!: string;

  @IsArray()
  @IsString({ each: true })
  examples!: string[];

  @IsString()
  @IsOptional()
  instructions?: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
