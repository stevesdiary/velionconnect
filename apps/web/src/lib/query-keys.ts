export const queryKeys = {
  auth: {
    me: () => ['auth', 'me'] as const,
  },
  organizations: {
    all: () => ['organizations'] as const,
    detail: (slug: string) => ['organizations', slug] as const,
    members: (orgId: string) => ['organizations', orgId, 'members'] as const,
  },
  workspaces: {
    all: (orgId: string) => ['workspaces', orgId] as const,
    detail: (workspaceId: string) => ['workspaces', workspaceId] as const,
  },
  conversations: {
    all: (workspaceId: string, filters?: Record<string, unknown>) =>
      ['conversations', workspaceId, filters] as const,
    detail: (conversationId: string) => ['conversations', conversationId] as const,
  },
  messages: {
    all: (conversationId: string) => ['messages', conversationId] as const,
  },
  contacts: {
    all: (orgId: string) => ['contacts', orgId] as const,
    detail: (contactId: string) => ['contacts', contactId] as const,
  },
  connectedAccounts: {
    all: (orgId: string) => ['connected-accounts', orgId] as const,
  },
  posts: {
    all: (workspaceId: string) => ['posts', workspaceId] as const,
    detail: (postId: string) => ['posts', postId] as const,
  },
  notifications: {
    all: (userId: string) => ['notifications', userId] as const,
    unreadCount: (userId: string) => ['notifications', userId, 'unread-count'] as const,
  },
};
