export const Platform = {
  INSTAGRAM: 'INSTAGRAM',
  FACEBOOK: 'FACEBOOK',
  WHATSAPP: 'WHATSAPP',
  LINKEDIN: 'LINKEDIN',
  TWITTER: 'TWITTER',
  TIKTOK: 'TIKTOK',
} as const;
export type Platform = (typeof Platform)[keyof typeof Platform];

export const OrgRole = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
  VIEWER: 'VIEWER',
} as const;
export type OrgRole = (typeof OrgRole)[keyof typeof OrgRole];

export const PlanType = {
  FREE: 'FREE',
  STARTER: 'STARTER',
  GROWTH: 'GROWTH',
  ENTERPRISE: 'ENTERPRISE',
} as const;
export type PlanType = (typeof PlanType)[keyof typeof PlanType];

export const ConversationStatus = {
  OPEN: 'OPEN',
  PENDING: 'PENDING',
  RESOLVED: 'RESOLVED',
  ARCHIVED: 'ARCHIVED',
} as const;
export type ConversationStatus = (typeof ConversationStatus)[keyof typeof ConversationStatus];

export const ConversationChannel = {
  INSTAGRAM_DM: 'INSTAGRAM_DM',
  INSTAGRAM_COMMENT: 'INSTAGRAM_COMMENT',
  FACEBOOK_MESSENGER: 'FACEBOOK_MESSENGER',
  FACEBOOK_COMMENT: 'FACEBOOK_COMMENT',
  WHATSAPP: 'WHATSAPP',
  LINKEDIN_DM: 'LINKEDIN_DM',
  LINKEDIN_COMMENT: 'LINKEDIN_COMMENT',
} as const;
export type ConversationChannel = (typeof ConversationChannel)[keyof typeof ConversationChannel];

export const MessageDirection = {
  INBOUND: 'INBOUND',
  OUTBOUND: 'OUTBOUND',
} as const;
export type MessageDirection = (typeof MessageDirection)[keyof typeof MessageDirection];

export const MessageStatus = {
  SENDING: 'SENDING',
  SENT: 'SENT',
  DELIVERED: 'DELIVERED',
  READ: 'READ',
  FAILED: 'FAILED',
} as const;
export type MessageStatus = (typeof MessageStatus)[keyof typeof MessageStatus];

export const MessageType = {
  TEXT: 'TEXT',
  IMAGE: 'IMAGE',
  VIDEO: 'VIDEO',
  AUDIO: 'AUDIO',
  DOCUMENT: 'DOCUMENT',
  STICKER: 'STICKER',
  REACTION: 'REACTION',
  STORY_MENTION: 'STORY_MENTION',
  COMMENT: 'COMMENT',
  SYSTEM: 'SYSTEM',
} as const;
export type MessageType = (typeof MessageType)[keyof typeof MessageType];

export const PostStatus = {
  DRAFT: 'DRAFT',
  SCHEDULED: 'SCHEDULED',
  PUBLISHING: 'PUBLISHING',
  PUBLISHED: 'PUBLISHED',
  FAILED: 'FAILED',
} as const;
export type PostStatus = (typeof PostStatus)[keyof typeof PostStatus];

export const AccountStatus = {
  CONNECTED: 'CONNECTED',
  DISCONNECTED: 'DISCONNECTED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  ERROR: 'ERROR',
} as const;
export type AccountStatus = (typeof AccountStatus)[keyof typeof AccountStatus];

export const NotificationType = {
  NEW_MESSAGE: 'NEW_MESSAGE',
  MENTIONED: 'MENTIONED',
  ASSIGNED: 'ASSIGNED',
  COMMENT: 'COMMENT',
  POST_PUBLISHED: 'POST_PUBLISHED',
  POST_FAILED: 'POST_FAILED',
  SYSTEM: 'SYSTEM',
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];
