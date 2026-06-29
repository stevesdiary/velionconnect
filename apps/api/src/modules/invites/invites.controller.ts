import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
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

import { CreateInviteDto } from './dto/create-invite.dto';
import { InvitesService } from './invites.service';

type OrgRequest = Request & { orgId: string };

@ApiTags('invites')
@Controller()
export class InvitesController {
  constructor(private readonly invitesService: InvitesService) {}

  @Post('organizations/:orgSlug/invites')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(OrgRole.ADMIN)
  create(
    @Req() req: OrgRequest,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateInviteDto,
  ) {
    return this.invitesService.create(req.orgId, user.sub, dto);
  }

  @Get('organizations/:orgSlug/invites')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(OrgRole.ADMIN)
  findAll(@Req() req: OrgRequest) {
    return this.invitesService.findAll(req.orgId);
  }

  @Delete('organizations/:orgSlug/invites/:inviteId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(OrgRole.ADMIN)
  revoke(
    @Req() req: OrgRequest,
    @Param('inviteId') inviteId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.invitesService.revoke(req.orgId, inviteId, user.sub);
  }

  @Get('invites/:token')
  getByToken(@Param('token') token: string) {
    return this.invitesService.getByToken(token);
  }

  @Post('invites/:token/accept')
  @UseGuards(JwtAuthGuard)
  accept(@Param('token') token: string, @CurrentUser() user: JwtPayload) {
    return this.invitesService.accept(token, user.sub);
  }
}
