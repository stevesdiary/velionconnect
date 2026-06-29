import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { AiModule, AI_SUGGESTION_QUEUE } from '../modules/ai/ai.module';
import { ConnectorsModule } from '../modules/connectors/connectors.module';
import { ContactsModule } from '../modules/contacts/contacts.module';
import { ConversationsModule } from '../modules/conversations/conversations.module';
import { GatewaysModule } from '../gateways/gateways.module';
import { MessagesModule } from '../modules/messages/messages.module';
import { PublishingModule } from '../modules/publishing/publishing.module';
import { POST_PUBLISHER_QUEUE } from '../modules/publishing/publishing.service';
import { WEBHOOK_QUEUE } from '../modules/webhooks/webhooks.service';

import { AiSuggestionWorker } from './ai-suggestion.worker';
import { PostPublisherWorker } from './post-publisher.worker';
import { WebhookProcessorWorker } from './webhook-processor.worker';

@Module({
  imports: [
    BullModule.registerQueue({ name: WEBHOOK_QUEUE }),
    BullModule.registerQueue({ name: POST_PUBLISHER_QUEUE }),
    BullModule.registerQueue({ name: AI_SUGGESTION_QUEUE }),
    AiModule,
    ConnectorsModule,
    ContactsModule,
    ConversationsModule,
    GatewaysModule,
    MessagesModule,
    PublishingModule,
  ],
  providers: [WebhookProcessorWorker, PostPublisherWorker, AiSuggestionWorker],
})
export class WorkersModule {}
