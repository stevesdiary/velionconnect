import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

import { ContactsService } from './contacts.service';
import { UpdateContactDto } from './dto/update-contact.dto';

type OrgRequest = Request & { orgId: string };

@Controller('organizations/:orgSlug/contacts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ContactsController {
  constructor(private readonly service: ContactsService) {}

  @Get()
  findAll(
    @Req() req: OrgRequest,
    @Query('search') search?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findAll(req.orgId, {
      search,
      cursor,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get(':contactId')
  findOne(@Req() req: OrgRequest, @Param('contactId') contactId: string) {
    return this.service.findById(req.orgId, contactId);
  }

  @Patch(':contactId')
  update(
    @Req() req: OrgRequest,
    @Param('contactId') contactId: string,
    @Body() dto: UpdateContactDto,
  ) {
    return this.service.update(req.orgId, contactId, dto);
  }

  @Post(':contactId/merge/:targetId')
  merge(
    @Req() req: OrgRequest,
    @Param('contactId') sourceId: string,
    @Param('targetId') targetId: string,
  ) {
    return this.service.merge(req.orgId, sourceId, targetId);
  }
}
