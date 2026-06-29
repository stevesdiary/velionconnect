import { IsEmail, IsEnum, IsOptional } from 'class-validator';
import { OrgRole } from '@velion/types';

export class CreateInviteDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsEnum(OrgRole)
  role?: OrgRole;
}
