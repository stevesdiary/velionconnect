import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { ConversationStatus } from '@velion/types';

export class UpdateConversationDto {
  @IsOptional()
  @IsEnum(ConversationStatus)
  status?: ConversationStatus;

  @IsOptional()
  @IsBoolean()
  isStarred?: boolean;

  @IsOptional()
  @IsString()
  assignedToId?: string | null;

  @IsOptional()
  @IsString()
  workspaceId?: string | null;
}
