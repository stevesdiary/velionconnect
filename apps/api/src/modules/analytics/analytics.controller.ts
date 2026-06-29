import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

import { AnalyticsService } from './analytics.service';

type OrgRequest = Request & { orgId: string };

@Controller('organizations/:orgSlug/workspaces/:workspaceSlug/analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}

  @Get()
  getWorkspaceAnalytics(
    @Req() req: OrgRequest,
    @Param('workspaceSlug') workspaceSlug: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const now = new Date();
    const toDate = to ? new Date(to) : now;
    const fromDate = from
      ? new Date(from)
      : new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000); // last 30 days

    return this.service.getWorkspaceAnalytics(
      req.orgId,
      workspaceSlug,
      fromDate,
      toDate,
    );
  }
}
