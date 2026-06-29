import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { PostStatus } from '@velion/types';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
  CurrentUser,
  JwtPayload,
} from '../../common/decorators/current-user.decorator';

import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PublishingService } from './publishing.service';

type OrgRequest = Request & { orgId: string };

@Controller('organizations/:orgSlug/workspaces/:workspaceSlug/posts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PublishingController {
  constructor(private readonly service: PublishingService) {}

  @Get()
  findAll(
    @Req() req: OrgRequest,
    @Param('workspaceSlug') workspaceSlug: string,
    @Query('status') status?: PostStatus,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.service.findAll(req.orgId, workspaceSlug, { status, from, to });
  }

  @Get(':postId')
  findOne(
    @Req() req: OrgRequest,
    @Param('workspaceSlug') workspaceSlug: string,
    @Param('postId') postId: string,
  ) {
    return this.service.findOne(req.orgId, workspaceSlug, postId);
  }

  @Post()
  create(
    @Req() req: OrgRequest,
    @Param('workspaceSlug') workspaceSlug: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreatePostDto,
  ) {
    return this.service.create(req.orgId, workspaceSlug, user.sub, dto);
  }

  @Patch(':postId')
  update(
    @Req() req: OrgRequest,
    @Param('workspaceSlug') workspaceSlug: string,
    @CurrentUser() user: JwtPayload,
    @Param('postId') postId: string,
    @Body() dto: UpdatePostDto,
  ) {
    return this.service.update(req.orgId, workspaceSlug, postId, user.sub, dto);
  }

  @Delete(':postId')
  @HttpCode(204)
  async remove(
    @Req() req: OrgRequest,
    @Param('workspaceSlug') workspaceSlug: string,
    @CurrentUser() user: JwtPayload,
    @Param('postId') postId: string,
  ) {
    await this.service.remove(req.orgId, workspaceSlug, postId, user.sub);
  }

  @Post(':postId/publish')
  publishNow(
    @Req() req: OrgRequest,
    @Param('workspaceSlug') workspaceSlug: string,
    @CurrentUser() user: JwtPayload,
    @Param('postId') postId: string,
  ) {
    return this.service.publishNow(req.orgId, workspaceSlug, postId, user.sub);
  }
}
