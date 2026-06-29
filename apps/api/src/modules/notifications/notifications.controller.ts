import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import {
  CurrentUser,
  JwtPayload,
} from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.notificationsService.findAll(
      user.sub,
      cursor,
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  @Get('unread-count')
  getUnreadCount(@CurrentUser() user: JwtPayload) {
    return this.notificationsService.getUnreadCount(user.sub);
  }

  @Patch('read-all')
  markAllRead(@CurrentUser() user: JwtPayload) {
    return this.notificationsService.markAllRead(user.sub);
  }

  @Patch(':id/read')
  markRead(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.notificationsService.markRead(user.sub, id);
  }
}
