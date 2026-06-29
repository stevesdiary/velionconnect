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
import { Platform } from '@velion/types';
import { Request } from 'express';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CurrentUser,
  JwtPayload,
} from '../../common/decorators/current-user.decorator';

import { ConnectedAccountsService } from './connected-accounts.service';
import { ConnectWhatsAppDto } from './dto/connect-whatsapp.dto';
import { ConnectOAuthDto } from './dto/connect-oauth.dto';

type OrgRequest = Request & { orgId: string };

@Controller('organizations/:orgSlug/connected-accounts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ConnectedAccountsController {
  constructor(private readonly service: ConnectedAccountsService) {}

  @Get()
  findAll(@Req() req: OrgRequest) {
    return this.service.findAll(req.orgId);
  }

  @Get(':id')
  findOne(@Req() req: OrgRequest, @Param('id') id: string) {
    return this.service.findById(req.orgId, id);
  }

  @Post('whatsapp')
  @Roles('ADMIN')
  connectWhatsApp(
    @Req() req: OrgRequest,
    @CurrentUser() user: JwtPayload,
    @Body() dto: ConnectWhatsAppDto,
  ) {
    return this.service.connectWhatsApp(req.orgId, user.sub, dto);
  }

  @Post('instagram/oauth')
  @Roles('ADMIN')
  connectInstagram(
    @Req() req: OrgRequest,
    @CurrentUser() user: JwtPayload,
    @Body() dto: ConnectOAuthDto,
  ) {
    return this.service.connectOAuth(
      req.orgId,
      user.sub,
      Platform.INSTAGRAM,
      dto,
    );
  }

  @Post('facebook/oauth')
  @Roles('ADMIN')
  connectFacebook(
    @Req() req: OrgRequest,
    @CurrentUser() user: JwtPayload,
    @Body() dto: ConnectOAuthDto,
  ) {
    return this.service.connectOAuth(
      req.orgId,
      user.sub,
      Platform.FACEBOOK,
      dto,
    );
  }

  @Post('linkedin/oauth')
  @Roles('ADMIN')
  connectLinkedIn(
    @Req() req: OrgRequest,
    @CurrentUser() user: JwtPayload,
    @Body() dto: ConnectOAuthDto,
  ) {
    return this.service.connectOAuth(
      req.orgId,
      user.sub,
      Platform.LINKEDIN,
      dto,
    );
  }

  @Delete(':id')
  @Roles('ADMIN')
  disconnect(
    @Req() req: OrgRequest,
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.service.disconnect(req.orgId, id, user.sub);
  }
}
