import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { OrgRole } from '@velion/types';
import { Request } from 'express';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

import { LabelsService } from './labels.service';

type OrgRequest = Request & { orgId: string };

@Controller('organizations/:orgSlug/labels')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LabelsController {
  constructor(private readonly service: LabelsService) {}

  @Get()
  findAll(@Req() req: OrgRequest) {
    return this.service.findAll(req.orgId);
  }

  @Post()
  @Roles(OrgRole.ADMIN)
  create(@Req() req: OrgRequest, @Body() dto: { name: string; color: string }) {
    return this.service.create(req.orgId, dto);
  }

  @Patch(':labelId')
  @Roles(OrgRole.ADMIN)
  update(
    @Req() req: OrgRequest,
    @Param('labelId') labelId: string,
    @Body() dto: { name?: string; color?: string },
  ) {
    return this.service.update(req.orgId, labelId, dto);
  }

  @Delete(':labelId')
  @Roles(OrgRole.ADMIN)
  @HttpCode(204)
  remove(@Req() req: OrgRequest, @Param('labelId') labelId: string) {
    return this.service.remove(req.orgId, labelId);
  }
}
