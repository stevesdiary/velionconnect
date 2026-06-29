import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ConversationChannel, Platform, MessageType } from '@velion/types';

import { ConnectedAccountsService } from '../modules/connectors/connected-accounts.service';
import { ConnectorFactory } from '../modules/connectors/connector.factory';
import { ContactsService } from '../modules/contacts/contacts.service';
import { ConversationsService } from '../modules/conversations/conversations.service';
import { MessagesService } from '../modules/messages/messages.service';
import {
  WEBHOOK_QUEUE,
  WebhookJobData,
} from '../modules/webhooks/webhooks.service';

const PLATFORM_TO_CHANNEL: Partial<Record<Platform, ConversationChannel>> = {
  [Platform.WHATSAPP]: ConversationChannel.WHATSAPP,
  [Platform.INSTAGRAM]: ConversationChannel.INSTAGRAM_DM,
  [Platform.FACEBOOK]: ConversationChannel.FACEBOOK_MESSENGER,
  [Platform.LINKEDIN]: ConversationChannel.LINKEDIN_DM,
};

@Processor(WEBHOOK_QUEUE, { concurrency: 10 })
export class WebhookProcessorWorker extends WorkerHost {
  private readonly logger = new Logger(WebhookProcessorWorker.name);

  constructor(
    private readonly connectedAccounts: ConnectedAccountsService,
    private readonly connectorFactory: ConnectorFactory,
    private readonly contacts: ContactsService,
    private readonly conversations: ConversationsService,
    private readonly messages: MessagesService,
  ) {
    super();
  }

  async process(job: Job<WebhookJobData>) {
    const { platform, payload, signature } = job.data;
    const platformEnum = platform.toUpperCase() as Platform;

    let connector;
    try {
      connector = this.connectorFactory.getConnector(platformEnum);
    } catch {
      this.logger.warn(`Unknown platform: ${platform}`);
      return;
    }

    const events = await connector.handleWebhook(payload, signature);

    for (const event of events) {
      if (event.type !== 'message') continue;
      if (!event.platformSenderId || !event.platformMessageId) continue;

      try {
        // Find the connected account this message belongs to
        const connectedAccount = await this.resolveConnectedAccount(
          platformEnum,
          payload,
        );
        if (!connectedAccount) {
          this.logger.warn(
            `No connected account found for platform=${platform}`,
          );
          continue;
        }

        // Resolve or create contact
        const contact = await this.contacts.resolveOrCreate(
          connectedAccount.organizationId,
          platformEnum,
          event.platformSenderId,
          event.senderName ?? event.platformSenderId,
          { avatarUrl: event.senderAvatarUrl ?? undefined },
        );

        // Get or create conversation
        const channel =
          PLATFORM_TO_CHANNEL[platformEnum] ?? ConversationChannel.WHATSAPP;
        const conversation = await this.conversations.getOrCreate(
          connectedAccount.organizationId,
          contact.id,
          channel,
          connectedAccount.id,
          event.platformSenderId, // use sender as thread ID for DMs
        );

        // Store the message (idempotent)
        await this.messages.createInbound({
          conversationId: conversation.id,
          connectedAccountId: connectedAccount.id,
          platformMessageId: event.platformMessageId,
          content: event.text ?? null,
          type: MessageType.TEXT,
          mediaUrls: event.mediaUrls,
          sentAt: event.timestamp,
          platformSenderId: event.platformSenderId,
        });
      } catch (err) {
        this.logger.error(
          `Failed to process webhook event: ${String(err)}`,
          err,
        );
        // Don't throw — other events in this job should still be processed
      }
    }
  }

  private async resolveConnectedAccount(
    platform: Platform,
    payload: Record<string, unknown>,
  ) {
    let platformAccountId: string | undefined;

    if (platform === Platform.WHATSAPP) {
      // Extract phone_number_id from Meta WhatsApp webhook
      const entries = payload['entry'] as
        | Array<{
            changes?: Array<{
              value?: { metadata?: { phone_number_id?: string } };
            }>;
          }>
        | undefined;
      platformAccountId =
        entries?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id;
    } else if (
      platform === Platform.INSTAGRAM ||
      platform === Platform.FACEBOOK
    ) {
      // Extract page ID / IG account ID
      const entries = payload['entry'] as Array<{ id?: string }> | undefined;
      platformAccountId = entries?.[0]?.id;
    }

    if (!platformAccountId) return null;

    return this.connectedAccounts.findByPlatformAccountId(
      platform,
      platformAccountId,
    );
  }
}
