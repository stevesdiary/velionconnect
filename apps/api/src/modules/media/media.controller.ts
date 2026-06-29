import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
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

import { MediaService } from './media.service';

type OrgRequest = Request & { orgId: string };

@Controller('organizations/:orgSlug/media')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MediaController {
  constructor(private readonly service: MediaService) {}

  @Get()
  findAll(@Req() req: OrgRequest, @Query('workspaceId') workspaceId?: string) {
    return this.service.findAll(req.orgId, workspaceId);
  }

  @Post('presign')
  getPresignedUpload(
    @Req() req: OrgRequest,
    @Body() body: { mimeType: string; filename: string },
  ) {
    return this.service.getPresignedUpload(
      req.orgId,
      body.mimeType,
      body.filename,
    );
  }

  @Post('confirm')
  confirmUpload(
    @Req() req: OrgRequest,
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      key: string;
      originalName: string;
      mimeType: string;
      sizeBytes: number;
      workspaceId?: string;
      width?: number;
      height?: number;
    },
  ) {
    return this.service.confirmUpload(
      req.orgId,
      body.workspaceId ?? null,
      user.sub,
      body,
    );
  }

  @Delete(':mediaId')
  @HttpCode(204)
  async remove(@Req() req: OrgRequest, @Param('mediaId') mediaId: string) {
    await this.service.remove(req.orgId, mediaId);
  }
}
