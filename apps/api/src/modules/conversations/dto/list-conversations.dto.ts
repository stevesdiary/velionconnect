import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ConversationChannel, ConversationStatus } from '@velion/types';

export class ListConversationsDto {
  @IsOptional()
  @IsEnum(ConversationStatus)
  status?: ConversationStatus;

  @IsOptional()
  @IsEnum(ConversationChannel)
  channel?: ConversationChannel;

  @IsOptional()
  @IsString()
  assignedToId?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isStarred?: boolean;

  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(value as string))
  limit?: number;
}
