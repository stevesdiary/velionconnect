import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { MessageType } from '@velion/types';

export class SendMessageDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  text?: string;

  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @IsOptional()
  @IsEnum(['image', 'video', 'audio', 'document'])
  mediaType?: 'image' | 'video' | 'audio' | 'document';

  @IsOptional()
  @IsString()
  replyToId?: string;

  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType;
}
