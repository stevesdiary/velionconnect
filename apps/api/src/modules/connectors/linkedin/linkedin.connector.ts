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
export class LinkedInConnector implements SocialConnector {
  readonly platform = Platform.LINKEDIN;
  private readonly logger = new Logger(LinkedInConnector.name);
  private readonly apiBase = 'https://api.linkedin.com/v2';

  constructor(private readonly config: ConfigService) {}

  async connect(credentials: OAuthCredentials): Promise<ConnectedAccountData> {
    const tokenRes = await fetch(
      'https://www.linkedin.com/oauth/v2/accessToken',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: credentials.code,
          redirect_uri: credentials.redirectUri,
          client_id: this.config.get<string>('linkedin.clientId') ?? '',
          client_secret: this.config.get<string>('linkedin.clientSecret') ?? '',
        }),
      },
    );

    if (!tokenRes.ok) throw new Error('LinkedIn OAuth exchange failed');
    const tokenData = (await tokenRes.json()) as {
      access_token: string;
      expires_in: number;
      refresh_token?: string;
      refresh_token_expires_in?: number;
    };

    const meRes = await fetch(
      `${this.apiBase}/me?projection=(id,localizedFirstName,localizedLastName)`,
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      },
    );
    const me = (await meRes.json()) as {
      id: string;
      localizedFirstName: string;
      localizedLastName: string;
    };

    return {
      id: '',
      platform: Platform.LINKEDIN,
      platformAccountId: me.id,
      displayName: `${me.localizedFirstName} ${me.localizedLastName}`,
      username: null,
      avatarUrl: null,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token ?? null,
      tokenExpiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
      scopes: [],
      metadata: {},
    };
  }

  async refreshToken(
    account: ConnectedAccountData,
  ): Promise<ConnectedAccountData> {
    if (!account.refreshToken)
      throw new Error('No refresh token available for LinkedIn');

    const res = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: account.refreshToken,
        client_id: this.config.get<string>('linkedin.clientId') ?? '',
        client_secret: this.config.get<string>('linkedin.clientSecret') ?? '',
      }),
    });

    if (!res.ok) throw new Error('LinkedIn token refresh failed');
    const data = (await res.json()) as {
      access_token: string;
      expires_in: number;
      refresh_token?: string;
    };

    return {
      ...account,
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? account.refreshToken,
      tokenExpiresAt: new Date(Date.now() + data.expires_in * 1000),
    };
  }

  async syncMessages(
    account: ConnectedAccountData,
    _since?: Date,
  ): Promise<SyncedMessage[]> {
    this.logger.debug(`Syncing LinkedIn DMs for account ${account.id}`);
    return [];
  }

  async sendMessage(
    account: ConnectedAccountData,
    params: SendMessageParams,
  ): Promise<SentMessage> {
    const res = await fetch(`${this.apiBase}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${account.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipients: [
          {
            'com.linkedin.voyager.messaging.MessagingMember': {
              miniProfile: params.to,
            },
          },
        ],
        subject: '',
        body: params.text ?? '',
      }),
    });

    if (!res.ok) throw new Error('LinkedIn send failed');
    return { platformMessageId: crypto.randomUUID(), sentAt: new Date() };
  }

  async publishPost(
    account: ConnectedAccountData,
    caption: string,
    _mediaUrls: string[],
    _options?: Record<string, unknown>,
  ): Promise<PublishedPost> {
    const res = await fetch(`${this.apiBase}/ugcPosts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${account.accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        author: `urn:li:person:${account.platformAccountId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: caption },
            shareMediaCategory: 'NONE',
          },
        },
        visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
      }),
    });

    if (!res.ok) throw new Error('LinkedIn post failed');
    const postId = res.headers.get('x-restli-id') ?? crypto.randomUUID();

    return {
      platformPostId: postId,
      platformUrl: `https://www.linkedin.com/feed/update/${postId}/`,
      publishedAt: new Date(),
    };
  }

  async fetchMentions(account: ConnectedAccountData): Promise<SyncedMessage[]> {
    this.logger.debug(`Fetching LinkedIn mentions for ${account.id}`);
    return [];
  }

  async fetchComments(
    account: ConnectedAccountData,
    postId: string,
  ): Promise<SyncedMessage[]> {
    this.logger.debug(
      `Fetching LinkedIn comments for post ${postId} on account ${account.id}`,
    );
    return [];
  }

  async handleWebhook(
    _payload: Record<string, unknown>,
    _signature: string,
  ): Promise<WebhookEvent[]> {
    return [];
  }

  verifyWebhookChallenge(
    _challenge: string,
    _verifyToken: string,
  ): string | null {
    return null;
  }
}
