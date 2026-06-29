import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
  CurrentUser,
  JwtPayload,
} from '../../common/decorators/current-user.decorator';

import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/send-message.dto';

type OrgRequest = Request & { orgId: string };

@Controller('organizations/:orgSlug/conversations/:conversationId/messages')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MessagesController {
  constructor(private readonly service: MessagesService) {}

  @Get()
  findAll(
    @Req() req: OrgRequest,
    @Param('conversationId') conversationId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findAll(req.orgId, conversationId, {
      cursor,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Post()
  send(
    @Req() req: OrgRequest,
    @Param('conversationId') conversationId: string,
    @Body() dto: SendMessageDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.send(req.orgId, conversationId, dto, user.sub);
  }
}
