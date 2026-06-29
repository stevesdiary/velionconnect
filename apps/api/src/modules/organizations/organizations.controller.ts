import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OrgRole } from '@velion/types';

import {
  CurrentUser,
  JwtPayload,
} from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateMemberRoleDto } from './dto/update-member.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrganizationsService } from './organizations.service';

@ApiTags('organizations')
@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(private readonly orgsService: OrganizationsService) {}

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateOrganizationDto) {
    return this.orgsService.create(user.sub, dto);
  }

  @Get(':orgSlug')
  findOne(@Param('orgSlug') orgSlug: string) {
    return this.orgsService.findBySlug(orgSlug);
  }

  @Patch(':orgSlug')
  @UseGuards(RolesGuard)
  @Roles(OrgRole.ADMIN)
  async update(
    @Param('orgSlug') orgSlug: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateOrganizationDto,
  ) {
    const orgId = await this.orgsService.findOrgIdBySlug(orgSlug);
    return this.orgsService.update(orgId, user.sub, dto);
  }

  @Get(':orgSlug/members')
  async getMembers(@Param('orgSlug') orgSlug: string) {
    const orgId = await this.orgsService.findOrgIdBySlug(orgSlug);
    return this.orgsService.getMembers(orgId);
  }

  @Patch(':orgSlug/members/:userId/role')
  @UseGuards(RolesGuard)
  @Roles(OrgRole.ADMIN)
  async updateMemberRole(
    @Param('orgSlug') orgSlug: string,
    @Param('userId') targetUserId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    const orgId = await this.orgsService.findOrgIdBySlug(orgSlug);
    return this.orgsService.updateMemberRole(
      orgId,
      user.sub,
      targetUserId,
      dto.role,
    );
  }

  @Delete(':orgSlug/members/:userId')
  @UseGuards(RolesGuard)
  @Roles(OrgRole.ADMIN)
  async removeMember(
    @Param('orgSlug') orgSlug: string,
    @Param('userId') targetUserId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const orgId = await this.orgsService.findOrgIdBySlug(orgSlug);
    return this.orgsService.removeMember(orgId, user.sub, targetUserId);
  }
}
