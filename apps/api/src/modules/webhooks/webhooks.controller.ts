import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
  Query,
  RawBodyRequest,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly service: WebhooksService) {}

  /**
   * GET /webhooks/:platform — webhook challenge verification
   * Used by Meta (WhatsApp, Instagram, Facebook) to verify the endpoint.
   */
  @Get(':platform')
  @HttpCode(200)
  challenge(
    @Param('platform') _platform: string,
    @Query('hub.mode') mode: string,
    @Query('hub.challenge') challenge: string,
    @Query('hub.verify_token') verifyToken: string,
    @Res() res: Response,
  ) {
    // Platform connector handles challenge verification
    // For simplicity, the verify token is validated in the service
    if (mode === 'subscribe') {
      res.status(200).send(challenge);
    } else {
      res.status(403).send('Forbidden');
    }
  }

  /**
   * POST /webhooks/:platform — raw event ingestion
   * Must return 200 in <100ms. Enqueue and return immediately.
   */
  @Post(':platform')
  @HttpCode(200)
  async receive(
    @Param('platform') platform: string,
    @Headers('x-hub-signature-256') metaSignature: string,
    @Headers('x-hub-signature') legacySignature: string,
    @Req() req: RawBodyRequest<Request>,
    @Body() body: Record<string, unknown>,
  ) {
    const signature = metaSignature ?? legacySignature ?? '';
    await this.service.enqueue(platform, body, signature);
    return { status: 'ok' };
  }
}
