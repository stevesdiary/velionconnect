import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';

export interface WebhookJobData {
  platform: string;
  payload: Record<string, unknown>;
  signature: string;
}

export const WEBHOOK_QUEUE = 'webhook-processing';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    @InjectQueue(WEBHOOK_QUEUE) private readonly webhookQueue: Queue,
  ) {}

  async enqueue(
    platform: string,
    payload: Record<string, unknown>,
    signature: string,
  ) {
    await this.webhookQueue.add(
      'process',
      { platform, payload, signature } satisfies WebhookJobData,
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 500 },
      },
    );
    this.logger.debug(`Enqueued webhook for platform=${platform}`);
  }
}
