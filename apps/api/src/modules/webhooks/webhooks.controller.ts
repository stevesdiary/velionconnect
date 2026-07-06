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
import { Platform } from '@velion/types';
import { Request, Response } from 'express';

import { ConnectorFactory } from '../connectors/connector.factory';

import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(
    private readonly service: WebhooksService,
    private readonly connectorFactory: ConnectorFactory,
  ) {}

  /**
   * GET /webhooks/:platform — webhook challenge verification
   * Used by Meta (WhatsApp, Instagram, Facebook) to verify the endpoint.
   */
  @Get(':platform')
  @HttpCode(200)
  challenge(
    @Param('platform') platform: string,
    @Query('hub.mode') mode: string,
    @Query('hub.challenge') challenge: string,
    @Query('hub.verify_token') verifyToken: string,
    @Res() res: Response,
  ) {
    if (mode !== 'subscribe') {
      res.status(403).send('Forbidden');
      return;
    }

    try {
      const connector = this.connectorFactory.getConnector(
        platform.toUpperCase() as Platform,
      );
      const response = connector.verifyWebhookChallenge(challenge, verifyToken);
      if (response !== null) {
        res.status(200).send(response);
      } else {
        res.status(403).send('Forbidden');
      }
    } catch {
      // Unknown platform — fall back to accepting (avoids breaking unknown platforms)
      res.status(200).send(challenge);
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
