import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { ConnectorsModule } from '../modules/connectors/connectors.module';
import { ContactsModule } from '../modules/contacts/contacts.module';
import { ConversationsModule } from '../modules/conversations/conversations.module';
import { MessagesModule } from '../modules/messages/messages.module';
import { WEBHOOK_QUEUE } from '../modules/webhooks/webhooks.service';

import { WebhookProcessorWorker } from './webhook-processor.worker';

@Module({
  imports: [
    BullModule.registerQueue({ name: WEBHOOK_QUEUE }),
    ConnectorsModule,
    ContactsModule,
    ConversationsModule,
    MessagesModule,
  ],
  providers: [WebhookProcessorWorker],
})
export class WorkersModule {}
