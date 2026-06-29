import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OrgRole } from '@velion/types';
import { Request } from 'express';

import {
  CurrentUser,
  JwtPayload,
} from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

import { AddWorkspaceMemberDto } from './dto/add-workspace-member.dto';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { UpdateWorkspaceMemberDto } from './dto/update-workspace-member.dto';
import { WorkspacesService } from './workspaces.service';

type OrgRequest = Request & { orgId: string };

@ApiTags('workspaces')
@Controller('organizations/:orgSlug/workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Get()
  findAll(@Req() req: OrgRequest) {
    return this.workspacesService.findAll(req.orgId);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(OrgRole.ADMIN)
  create(
    @Req() req: OrgRequest,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateWorkspaceDto,
  ) {
    return this.workspacesService.create(req.orgId, user.sub, dto);
  }

  @Get(':workspaceSlug')
  findOne(
    @Req() req: OrgRequest,
    @Param('workspaceSlug') workspaceSlug: string,
  ) {
    return this.workspacesService.findBySlug(req.orgId, workspaceSlug);
  }

  @Patch(':workspaceSlug')
  @UseGuards(RolesGuard)
  @Roles(OrgRole.ADMIN)
  async update(
    @Req() req: OrgRequest,
    @Param('workspaceSlug') workspaceSlug: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateWorkspaceDto,
  ) {
    const ws = await this.workspacesService.findBySlug(
      req.orgId,
      workspaceSlug,
    );
    return this.workspacesService.update(ws.id, req.orgId, user.sub, dto);
  }

  @Delete(':workspaceSlug')
  @UseGuards(RolesGuard)
  @Roles(OrgRole.OWNER)
  async remove(
    @Req() req: OrgRequest,
    @Param('workspaceSlug') workspaceSlug: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const ws = await this.workspacesService.findBySlug(
      req.orgId,
      workspaceSlug,
    );
    return this.workspacesService.remove(ws.id, req.orgId, user.sub);
  }

  @Get(':workspaceSlug/members')
  async getMembers(
    @Req() req: OrgRequest,
    @Param('workspaceSlug') workspaceSlug: string,
  ) {
    const ws = await this.workspacesService.findBySlug(
      req.orgId,
      workspaceSlug,
    );
    return this.workspacesService.getMembers(ws.id);
  }

  @Post(':workspaceSlug/members')
  @UseGuards(RolesGuard)
  @Roles(OrgRole.ADMIN)
  async addMember(
    @Req() req: OrgRequest,
    @Param('workspaceSlug') workspaceSlug: string,
    @Body() dto: AddWorkspaceMemberDto,
  ) {
    const ws = await this.workspacesService.findBySlug(
      req.orgId,
      workspaceSlug,
    );
    return this.workspacesService.addMember(ws.id, req.orgId, dto);
  }

  @Patch(':workspaceSlug/members/:userId/role')
  @UseGuards(RolesGuard)
  @Roles(OrgRole.ADMIN)
  async updateMemberRole(
    @Req() req: OrgRequest,
    @Param('workspaceSlug') workspaceSlug: string,
    @Param('userId') targetUserId: string,
    @Body() dto: UpdateWorkspaceMemberDto,
  ) {
    const ws = await this.workspacesService.findBySlug(
      req.orgId,
      workspaceSlug,
    );
    return this.workspacesService.updateMemberRole(
      ws.id,
      req.orgId,
      targetUserId,
      dto.role,
    );
  }

  @Delete(':workspaceSlug/members/:userId')
  @UseGuards(RolesGuard)
  @Roles(OrgRole.ADMIN)
  async removeMember(
    @Req() req: OrgRequest,
    @Param('workspaceSlug') workspaceSlug: string,
    @Param('userId') targetUserId: string,
  ) {
    const ws = await this.workspacesService.findBySlug(
      req.orgId,
      workspaceSlug,
    );
    return this.workspacesService.removeMember(ws.id, req.orgId, targetUserId);
  }
}
