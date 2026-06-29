import { IsEnum, IsOptional, IsString } from 'class-validator';
import { OrgRole } from '@velion/types';

export class AddWorkspaceMemberDto {
  @IsString()
  userId!: string;

  @IsOptional()
  @IsEnum(OrgRole)
  role?: OrgRole;
}
