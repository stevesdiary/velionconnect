import { Platform } from './enums';

export interface OAuthCredentials {
  code: string;
  redirectUri: string;
  state?: string;
}

export interface ConnectedAccountData {
  id: string;
  platform: Platform;
  platformAccountId: string;
  displayName: string;
  username?: string | null;
  avatarUrl?: string | null;
  accessToken: string;
  refreshToken?: string | null;
  tokenExpiresAt?: Date | null;
  scopes: string[];
  metadata: Record<string, unknown>;
}

export interface SendMessageParams {
  to: string;
  text?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio' | 'document';
  replyToId?: string;
}

export interface SentMessage {
  platformMessageId: string;
  sentAt: Date;
}

export interface PublishedPost {
  platformPostId: string;
  platformUrl?: string | null;
  publishedAt: Date;
}

export interface WebhookEvent {
  type: 'message' | 'mention' | 'comment' | 'reaction' | 'status_update' | 'unknown';
  platformMessageId?: string | null;
  platformSenderId?: string | null;
  senderName?: string | null;
  senderAvatarUrl?: string | null;
  text?: string | null;
  mediaUrls?: string[];
  timestamp: Date;
  raw: Record<string, unknown>;
}

export interface SyncedMessage {
  platformMessageId: string;
  platformSenderId: string;
  senderName: string;
  senderAvatarUrl?: string | null;
  text?: string | null;
  mediaUrls?: string[];
  timestamp: Date;
  isFromMe: boolean;
}

export interface SocialConnector {
  readonly platform: Platform;
  connect(credentials: OAuthCredentials): Promise<ConnectedAccountData>;
  refreshToken(account: ConnectedAccountData): Promise<ConnectedAccountData>;
  syncMessages(account: ConnectedAccountData, since?: Date): Promise<SyncedMessage[]>;
  sendMessage(account: ConnectedAccountData, params: SendMessageParams): Promise<SentMessage>;
  publishPost(
    account: ConnectedAccountData,
    caption: string,
    mediaUrls: string[],
    options?: Record<string, unknown>,
  ): Promise<PublishedPost>;
  fetchMentions(account: ConnectedAccountData): Promise<SyncedMessage[]>;
  fetchComments(account: ConnectedAccountData, postId: string): Promise<SyncedMessage[]>;
  handleWebhook(
    payload: Record<string, unknown>,
    signature: string,
  ): Promise<WebhookEvent[]>;
  verifyWebhookChallenge(challenge: string, verifyToken: string): string | null;
}
