import { IsEnum } from 'class-validator';
import { OrgRole } from '@velion/types';

export class UpdateMemberRoleDto {
  @IsEnum(OrgRole)
  role!: OrgRole;
}
