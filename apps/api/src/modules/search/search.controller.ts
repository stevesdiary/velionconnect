import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

import { SearchService } from './search.service';

type OrgRequest = Request & { orgId: string };

@Controller('organizations/:orgSlug/search')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SearchController {
  constructor(private readonly service: SearchService) {}

  @Get()
  search(@Req() req: OrgRequest, @Query('q') query: string) {
    return this.service.search(req.orgId, query ?? '');
  }
}
