import {
  Body,
  Controller,
  Delete,
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

import { ConversationsService } from './conversations.service';
import { ListConversationsDto } from './dto/list-conversations.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';

type OrgRequest = Request & { orgId: string };

@Controller('organizations/:orgSlug/workspaces/:workspaceSlug/conversations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ConversationsController {
  constructor(private readonly service: ConversationsService) {}

  @Get()
  findAll(
    @Req() req: OrgRequest,
    @Param('workspaceSlug') workspaceSlug: string,
    @Query() query: ListConversationsDto,
  ) {
    // workspaceId resolution happens via workspaceSlug; for now pass slug as ID placeholder
    // TODO: resolve workspaceId from slug via WorkspacesService
    return this.service.findAll(req.orgId, workspaceSlug, query);
  }

  @Get(':conversationId')
  findOne(
    @Req() req: OrgRequest,
    @Param('conversationId') conversationId: string,
  ) {
    return this.service.findById(req.orgId, conversationId);
  }

  @Patch(':conversationId')
  update(
    @Req() req: OrgRequest,
    @Param('conversationId') conversationId: string,
    @Body() dto: UpdateConversationDto,
  ) {
    return this.service.update(req.orgId, conversationId, dto);
  }

  @Post(':conversationId/labels/:labelId')
  addLabel(
    @Req() req: OrgRequest,
    @Param('conversationId') conversationId: string,
    @Param('labelId') labelId: string,
  ) {
    return this.service.addLabel(req.orgId, conversationId, labelId);
  }

  @Delete(':conversationId/labels/:labelId')
  removeLabel(
    @Req() req: OrgRequest,
    @Param('conversationId') conversationId: string,
    @Param('labelId') labelId: string,
  ) {
    return this.service.removeLabel(req.orgId, conversationId, labelId);
  }

  @Post(':conversationId/read')
  markRead(
    @Req() req: OrgRequest,
    @Param('conversationId') conversationId: string,
  ) {
    return this.service.markRead(req.orgId, conversationId);
  }
}
