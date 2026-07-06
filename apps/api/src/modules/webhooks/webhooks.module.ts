import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { ConnectorsModule } from '../connectors/connectors.module';

import { WEBHOOK_QUEUE } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';

@Module({
  imports: [
    BullModule.registerQueue({ name: WEBHOOK_QUEUE }),
    ConnectorsModule,
  ],
  controllers: [WebhooksController],
  providers: [WebhooksService],
  exports: [WebhooksService],
})
export class WebhooksModule {}
