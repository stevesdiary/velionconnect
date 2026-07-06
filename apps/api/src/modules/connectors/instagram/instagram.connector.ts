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

@Injectable()
export class InstagramConnector implements SocialConnector {
  readonly platform = Platform.INSTAGRAM;
  private readonly logger = new Logger(InstagramConnector.name);
  private readonly graphApiBase: string;
  private readonly appSecret: string;

  constructor(private readonly config: ConfigService) {
    const version = config.get<string>('meta.graphApiVersion') ?? 'v19.0';
    this.graphApiBase = `https://graph.facebook.com/${version}`;
    this.appSecret = config.get<string>('meta.appSecret') ?? '';
  }

  async connect(credentials: OAuthCredentials): Promise<ConnectedAccountData> {
    // Exchange code for token via Meta OAuth
    const tokenUrl = `${this.graphApiBase}/oauth/access_token`;
    const res = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.config.get<string>('meta.appId') ?? '',
        client_secret: this.appSecret,
        code: credentials.code,
        redirect_uri: credentials.redirectUri,
      }),
    });

    if (!res.ok) throw new Error('Instagram OAuth exchange failed');
    const data = (await res.json()) as {
      access_token: string;
      token_type: string;
    };

    // Get long-lived token
    const llRes = await fetch(
      `${this.graphApiBase}/oauth/access_token?grant_type=fb_exchange_token&client_id=${this.config.get('meta.appId')}&client_secret=${this.appSecret}&fb_exchange_token=${data.access_token}`,
    );
    const llData = (await llRes.json()) as {
      access_token: string;
      expires_in: number;
    };

    // Get IG Business Account info
    const meRes = await fetch(
      `${this.graphApiBase}/me?fields=id,name,username,profile_picture_url&access_token=${llData.access_token}`,
    );
    const me = (await meRes.json()) as {
      id: string;
      name: string;
      username?: string;
      profile_picture_url?: string;
    };

    return {
      id: '',
      platform: Platform.INSTAGRAM,
      platformAccountId: me.id,
      displayName: me.name,
      username: me.username ?? null,
      avatarUrl: me.profile_picture_url ?? null,
      accessToken: llData.access_token,
      refreshToken: null,
      tokenExpiresAt: new Date(Date.now() + llData.expires_in * 1000),
      scopes: [],
      metadata: {},
    };
  }

  async refreshToken(
    account: ConnectedAccountData,
  ): Promise<ConnectedAccountData> {
    const res = await fetch(
      `${this.graphApiBase}/oauth/access_token?grant_type=ig_refresh_token&access_token=${account.accessToken}`,
    );
    const data = (await res.json()) as {
      access_token: string;
      expires_in: number;
    };
    return {
      ...account,
      accessToken: data.access_token,
      tokenExpiresAt: new Date(Date.now() + data.expires_in * 1000),
    };
  }

  async syncMessages(
    account: ConnectedAccountData,
    since?: Date,
  ): Promise<SyncedMessage[]> {
    // Instagram DM sync via Conversations API
    this.logger.debug(
      `Syncing Instagram DMs for account ${account.id} since ${since?.toISOString()}`,
    );
    return [];
  }

  async sendMessage(
    account: ConnectedAccountData,
    params: SendMessageParams,
  ): Promise<SentMessage> {
    const url = `${this.graphApiBase}/me/messages`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${account.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient: { id: params.to },
        message: params.text
          ? { text: params.text }
          : {
              attachment: {
                type: params.mediaType,
                payload: { url: params.mediaUrl },
              },
            },
      }),
    });

    if (!res.ok) throw new Error('Instagram send failed');
    const data = (await res.json()) as { message_id: string };
    return { platformMessageId: data.message_id, sentAt: new Date() };
  }

  async publishPost(
    account: ConnectedAccountData,
    caption: string,
    mediaUrls: string[],
    options?: Record<string, unknown>,
  ): Promise<PublishedPost> {
    const igUserId = account.platformAccountId;

    // Create media container
    const containerRes = await fetch(`${this.graphApiBase}/${igUserId}/media`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${account.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_url: mediaUrls[0],
        caption,
        ...(options ?? {}),
      }),
    });

    if (!containerRes.ok)
      throw new Error('Instagram media container creation failed');
    const container = (await containerRes.json()) as { id: string };

    // Publish the container
    const publishRes = await fetch(
      `${this.graphApiBase}/${igUserId}/media_publish`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${account.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ creation_id: container.id }),
      },
    );

    if (!publishRes.ok) throw new Error('Instagram publish failed');
    const published = (await publishRes.json()) as { id: string };

    return {
      platformPostId: published.id,
      platformUrl: `https://www.instagram.com/p/${published.id}/`,
      publishedAt: new Date(),
    };
  }

  async fetchMentions(account: ConnectedAccountData): Promise<SyncedMessage[]> {
    this.logger.debug(`Fetching Instagram mentions for ${account.id}`);
    return [];
  }

  async fetchComments(
    account: ConnectedAccountData,
    postId: string,
  ): Promise<SyncedMessage[]> {
    this.logger.debug(
      `Fetching Instagram comments for post ${postId} on account ${account.id}`,
    );
    return [];
  }

  async handleWebhook(
    payload: Record<string, unknown>,
    signature: string,
  ): Promise<WebhookEvent[]> {
    if (!this.verifyMetaSignature(JSON.stringify(payload), signature)) {
      this.logger.warn('Instagram webhook signature mismatch');
      return [];
    }

    const events: WebhookEvent[] = [];

    // Instagram Messaging API webhook format: object=instagram, entries with messaging array
    const entries = payload['entry'] as
      | Array<{
          id: string;
          time?: number;
          messaging?: Array<{
            sender: { id: string };
            recipient: { id: string };
            timestamp: number;
            message?: {
              mid: string;
              text?: string;
              attachments?: Array<{ type: string; payload: { url?: string } }>;
            };
          }>;
          changes?: Array<{
            field: string;
            value: Record<string, unknown>;
          }>;
        }>
      | undefined;

    if (!entries) return events;

    for (const entry of entries) {
      // DMs via Messenger Platform (messaging array)
      for (const msg of entry.messaging ?? []) {
        if (!msg.message) continue;

        const mediaUrls: string[] = (msg.message.attachments ?? [])
          .filter((a) => a.payload?.url)
          .map((a) => a.payload.url as string);

        events.push({
          type: 'message',
          platformMessageId: msg.message.mid,
          platformSenderId: msg.sender.id,
          senderName: msg.sender.id,
          senderAvatarUrl: null,
          text: msg.message.text ?? null,
          mediaUrls,
          timestamp: new Date(msg.timestamp),
          raw: msg as unknown as Record<string, unknown>,
        });
      }

      // Story mentions and other changes
      for (const change of entry.changes ?? []) {
        if (change.field === 'mentions') {
          events.push({
            type: 'mention',
            platformMessageId: null,
            platformSenderId: entry.id,
            senderName: null,
            senderAvatarUrl: null,
            text: null,
            mediaUrls: [],
            timestamp: new Date(),
            raw: change.value,
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

  private verifyMetaSignature(body: string, signature: string): boolean {
    if (!this.appSecret) return true;
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
