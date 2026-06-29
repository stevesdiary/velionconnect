import * as crypto from 'crypto';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ConnectedAccountData,
  OAuthCredentials,
  Platform,
  PublishedPost,
  SendMessageParams,
  SentMessage,
  SocialConnector,
  SyncedMessage,
  WebhookEvent,
} from '@velion/types';

interface WhatsAppMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
  image?: { id: string; mime_type: string; sha256: string; caption?: string };
  video?: { id: string; mime_type: string; sha256: string };
  audio?: { id: string; mime_type: string; sha256: string };
  document?: {
    id: string;
    mime_type: string;
    sha256: string;
    filename?: string;
  };
  sticker?: { id: string; mime_type: string };
  reaction?: { message_id: string; emoji: string };
}

interface WhatsAppContact {
  profile: { name: string };
  wa_id: string;
}

interface WhatsAppWebhookValue {
  messaging_product: string;
  metadata: { display_phone_number: string; phone_number_id: string };
  contacts?: WhatsAppContact[];
  messages?: WhatsAppMessage[];
  statuses?: Array<{
    id: string;
    status: string;
    timestamp: string;
    recipient_id: string;
  }>;
}

@Injectable()
export class WhatsAppConnector implements SocialConnector {
  readonly platform = Platform.WHATSAPP;
  private readonly logger = new Logger(WhatsAppConnector.name);
  private readonly graphApiBase: string;
  private readonly appSecret: string;

  constructor(private readonly config: ConfigService) {
    const version = config.get<string>('meta.graphApiVersion') ?? 'v19.0';
    this.graphApiBase = `https://graph.facebook.com/${version}`;
    this.appSecret = config.get<string>('meta.appSecret') ?? '';
  }

  // WhatsApp uses API key auth, not OAuth — this method isn't used in the normal flow
  async connect(_credentials: OAuthCredentials): Promise<ConnectedAccountData> {
    throw new Error(
      'WhatsApp uses API key auth. Use ConnectedAccountsService.connectWhatsApp().',
    );
  }

  async refreshToken(
    account: ConnectedAccountData,
  ): Promise<ConnectedAccountData> {
    // WhatsApp permanent tokens do not need refresh
    return account;
  }

  async syncMessages(
    account: ConnectedAccountData,
    _since?: Date,
  ): Promise<SyncedMessage[]> {
    // WhatsApp Cloud API doesn't support message pull; we rely on webhooks
    this.logger.debug(
      `syncMessages called for account ${account.id}, no-op for WhatsApp`,
    );
    return [];
  }

  async sendMessage(
    account: ConnectedAccountData,
    params: SendMessageParams,
  ): Promise<SentMessage> {
    const phoneNumberId = account.platformAccountId;
    const url = `${this.graphApiBase}/${phoneNumberId}/messages`;

    let body: Record<string, unknown>;

    if (params.mediaUrl && params.mediaType) {
      body = {
        messaging_product: 'whatsapp',
        to: params.to,
        type: params.mediaType,
        [params.mediaType]: { link: params.mediaUrl },
      };
    } else {
      body = {
        messaging_product: 'whatsapp',
        to: params.to,
        type: 'text',
        text: { body: params.text ?? '' },
      };
    }

    if (params.replyToId) {
      body['context'] = { message_id: params.replyToId };
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${account.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = (await res.json()) as { error?: { message?: string } };
      throw new Error(err.error?.message ?? 'WhatsApp send failed');
    }

    const data = (await res.json()) as { messages: [{ id: string }] };
    return {
      platformMessageId: data.messages[0].id,
      sentAt: new Date(),
    };
  }

  async publishPost(
    _account: ConnectedAccountData,
    _caption: string,
    _mediaUrls: string[],
    _options?: Record<string, unknown>,
  ): Promise<PublishedPost> {
    throw new Error('WhatsApp does not support post publishing');
  }

  async fetchMentions(
    _account: ConnectedAccountData,
  ): Promise<SyncedMessage[]> {
    return [];
  }

  async fetchComments(
    _account: ConnectedAccountData,
    _postId: string,
  ): Promise<SyncedMessage[]> {
    return [];
  }

  async handleWebhook(
    payload: Record<string, unknown>,
    signature: string,
  ): Promise<WebhookEvent[]> {
    const body = JSON.stringify(payload);
    if (!this.verifySignature(body, signature)) {
      this.logger.warn('WhatsApp webhook signature mismatch');
      return [];
    }

    const events: WebhookEvent[] = [];

    const entries = payload['entry'] as Array<{
      id: string;
      changes: Array<{ value: WhatsAppWebhookValue; field: string }>;
    }>;

    if (!entries) return events;

    for (const entry of entries) {
      for (const change of entry.changes ?? []) {
        if (change.field !== 'messages') continue;
        const value = change.value;
        const contacts = value.contacts ?? [];
        const messages = value.messages ?? [];

        for (const msg of messages) {
          const contact = contacts.find((c) => c.wa_id === msg.from);
          const text = msg.text?.body ?? null;
          const mediaUrls: string[] = [];

          events.push({
            type: 'message',
            platformMessageId: msg.id,
            platformSenderId: msg.from,
            senderName: contact?.profile.name ?? msg.from,
            senderAvatarUrl: null,
            text,
            mediaUrls,
            timestamp: new Date(parseInt(msg.timestamp) * 1000),
            raw: msg as unknown as Record<string, unknown>,
          });
        }

        // Handle status updates
        for (const status of value.statuses ?? []) {
          events.push({
            type: 'status_update',
            platformMessageId: status.id,
            platformSenderId: status.recipient_id,
            senderName: null,
            text: null,
            mediaUrls: [],
            timestamp: new Date(parseInt(status.timestamp) * 1000),
            raw: status as unknown as Record<string, unknown>,
          });
        }
      }
    }

    return events;
  }

  verifyWebhookChallenge(
    challenge: string,
    verifyToken: string,
  ): string | null {
    const expected = this.config.get<string>('meta.whatsappVerifyToken');
    if (verifyToken === expected) return challenge;
    return null;
  }

  private verifySignature(body: string, signature: string): boolean {
    if (!this.appSecret) return true; // Dev mode: skip if no secret configured
    const expected = `sha256=${crypto.createHmac('sha256', this.appSecret).update(body).digest('hex')}`;
    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expected),
      );
    } catch {
      return false;
    }
  }
}
