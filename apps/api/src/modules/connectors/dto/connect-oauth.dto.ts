import { IsOptional, IsString, MinLength } from 'class-validator';

export class ConnectOAuthDto {
  @IsString()
  @MinLength(1)
  code!: string;

  @IsString()
  @MinLength(1)
  redirectUri!: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  workspaceId?: string;
}
