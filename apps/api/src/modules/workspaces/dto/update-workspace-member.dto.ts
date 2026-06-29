import { IsEnum } from 'class-validator';
import { OrgRole } from '@velion/types';

export class UpdateWorkspaceMemberDto {
  @IsEnum(OrgRole)
  role!: OrgRole;
}
