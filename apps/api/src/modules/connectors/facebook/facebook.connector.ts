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
export class FacebookConnector implements SocialConnector {
  readonly platform = Platform.FACEBOOK;
  private readonly logger = new Logger(FacebookConnector.name);
  private readonly graphApiBase: string;
  private readonly appSecret: string;

  constructor(private readonly config: ConfigService) {
    const version = config.get<string>('meta.graphApiVersion') ?? 'v19.0';
    this.graphApiBase = `https://graph.facebook.com/${version}`;
    this.appSecret = config.get<string>('meta.appSecret') ?? '';
  }

  async connect(credentials: OAuthCredentials): Promise<ConnectedAccountData> {
    const tokenRes = await fetch(
      `${this.graphApiBase}/oauth/access_token?client_id=${this.config.get('meta.appId')}&client_secret=${this.appSecret}&code=${credentials.code}&redirect_uri=${credentials.redirectUri}`,
    );
    if (!tokenRes.ok) throw new Error('Facebook OAuth exchange failed');
    const tokenData = (await tokenRes.json()) as {
      access_token: string;
      expires_in: number;
    };

    const meRes = await fetch(
      `${this.graphApiBase}/me?fields=id,name,picture&access_token=${tokenData.access_token}`,
    );
    const me = (await meRes.json()) as {
      id: string;
      name: string;
      picture?: { data?: { url?: string } };
    };

    return {
      id: '',
      platform: Platform.FACEBOOK,
      platformAccountId: me.id,
      displayName: me.name,
      username: null,
      avatarUrl: me.picture?.data?.url ?? null,
      accessToken: tokenData.access_token,
      refreshToken: null,
      tokenExpiresAt: tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000)
        : null,
      scopes: [],
      metadata: {},
    };
  }

  async refreshToken(
    account: ConnectedAccountData,
  ): Promise<ConnectedAccountData> {
    // Facebook tokens are long-lived; refresh with fb_exchange_token
    const res = await fetch(
      `${this.graphApiBase}/oauth/access_token?grant_type=fb_exchange_token&client_id=${this.config.get('meta.appId')}&client_secret=${this.appSecret}&fb_exchange_token=${account.accessToken}`,
    );
    const data = (await res.json()) as {
      access_token: string;
      expires_in?: number;
    };
    return {
      ...account,
      accessToken: data.access_token,
      tokenExpiresAt: data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000)
        : null,
    };
  }

  async syncMessages(
    account: ConnectedAccountData,
    _since?: Date,
  ): Promise<SyncedMessage[]> {
    this.logger.debug(`Syncing Facebook Messenger for account ${account.id}`);
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
        message: { text: params.text ?? '' },
      }),
    });

    if (!res.ok) throw new Error('Facebook Messenger send failed');
    const data = (await res.json()) as { message_id: string };
    return { platformMessageId: data.message_id, sentAt: new Date() };
  }

  async publishPost(
    account: ConnectedAccountData,
    caption: string,
    mediaUrls: string[],
    _options?: Record<string, unknown>,
  ): Promise<PublishedPost> {
    const pageId = account.platformAccountId;
    const url = mediaUrls.length
      ? `${this.graphApiBase}/${pageId}/photos`
      : `${this.graphApiBase}/${pageId}/feed`;

    const body = mediaUrls.length
      ? { url: mediaUrls[0], message: caption }
      : { message: caption };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${account.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error('Facebook post failed');
    const data = (await res.json()) as { id: string; post_id?: string };
    const postId = data.post_id ?? data.id;

    return {
      platformPostId: postId,
      platformUrl: `https://www.facebook.com/${postId}`,
      publishedAt: new Date(),
    };
  }

  async fetchMentions(account: ConnectedAccountData): Promise<SyncedMessage[]> {
    this.logger.debug(`Fetching Facebook mentions for ${account.id}`);
    return [];
  }

  async fetchComments(
    account: ConnectedAccountData,
    postId: string,
  ): Promise<SyncedMessage[]> {
    this.logger.debug(
      `Fetching Facebook comments for post ${postId} on account ${account.id}`,
    );
    return [];
  }

  async handleWebhook(
    payload: Record<string, unknown>,
    signature: string,
  ): Promise<WebhookEvent[]> {
    if (!this.verifyMetaSignature(JSON.stringify(payload), signature)) {
      this.logger.warn('Facebook webhook signature mismatch');
      return [];
    }
    return [];
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
