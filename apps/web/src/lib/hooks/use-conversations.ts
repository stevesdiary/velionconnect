'use client';

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';

export interface ConversationContact {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface ConversationLabel {
  id: string;
  name: string;
  color: string;
}

export interface Conversation {
  id: string;
  organizationId: string;
  workspaceId: string | null;
  contactId: string;
  channel: string;
  connectedAccountId: string | null;
  status: 'OPEN' | 'PENDING' | 'RESOLVED' | 'ARCHIVED';
  isStarred: boolean;
  assignedToId: string | null;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  unreadCount: number;
  platformThreadId: string | null;
  createdAt: string;
  updatedAt: string;
  contact: ConversationContact;
  labels: ConversationLabel[];
}

export interface ConversationsPage {
  data: Conversation[];
  nextCursor: string | null;
}

export function useConversations(
  orgSlug: string,
  workspaceSlug: string,
  filters?: {
    status?: string;
    channel?: string;
    isStarred?: boolean;
    assignedToId?: string;
  },
) {
  return useQuery({
    queryKey: queryKeys.conversations.all(workspaceSlug, filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status) params.set('status', filters.status);
      if (filters?.channel) params.set('channel', filters.channel);
      if (filters?.isStarred !== undefined) params.set('isStarred', String(filters.isStarred));
      if (filters?.assignedToId) params.set('assignedToId', filters.assignedToId);

      const res = await apiClient.get<ConversationsPage>(
        `/organizations/${orgSlug}/workspaces/${workspaceSlug}/conversations?${params}`,
      );
      return res.data;
    },
    enabled: !!orgSlug && !!workspaceSlug,
  });
}

export function useConversation(orgSlug: string, conversationId: string) {
  return useQuery({
    queryKey: queryKeys.conversations.detail(conversationId),
    queryFn: async () => {
      const res = await apiClient.get<Conversation>(
        `/organizations/${orgSlug}/conversations/${conversationId}`,
      );
      return res.data;
    },
    enabled: !!conversationId,
  });
}

export function useUpdateConversation(orgSlug: string, workspaceSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      conversationId,
      data,
    }: {
      conversationId: string;
      data: {
        status?: string;
        isStarred?: boolean;
        assignedToId?: string | null;
      };
    }) => {
      const res = await apiClient.patch<Conversation>(
        `/organizations/${orgSlug}/workspaces/${workspaceSlug}/conversations/${conversationId}`,
        data,
      );
      return res.data;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.conversations.detail(variables.conversationId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.conversations.all(workspaceSlug),
      });
    },
  });
}

export function useConversationsInfinite(
  orgSlug: string,
  workspaceSlug: string,
  filters?: {
    status?: string;
    channel?: string;
    isStarred?: boolean;
    assignedToId?: string;
  },
) {
  return useInfiniteQuery({
    queryKey: [...queryKeys.conversations.all(workspaceSlug, filters), 'infinite'],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      if (filters?.status) params.set('status', filters.status);
      if (filters?.channel) params.set('channel', filters.channel);
      if (filters?.isStarred !== undefined) params.set('isStarred', String(filters.isStarred));
      if (filters?.assignedToId) params.set('assignedToId', filters.assignedToId);
      if (pageParam) params.set('cursor', pageParam);

      const res = await apiClient.get<ConversationsPage>(
        `/organizations/${orgSlug}/workspaces/${workspaceSlug}/conversations?${params}`,
      );
      return res.data;
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!orgSlug && !!workspaceSlug,
  });
}

export function useAddLabel(orgSlug: string, workspaceSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      conversationId,
      labelId,
    }: {
      conversationId: string;
      labelId: string;
    }) => {
      const res = await apiClient.post<Conversation>(
        `/organizations/${orgSlug}/workspaces/${workspaceSlug}/conversations/${conversationId}/labels/${labelId}`,
      );
      return res.data;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.conversations.detail(variables.conversationId),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.conversations.all(workspaceSlug) });
    },
  });
}

export function useRemoveLabel(orgSlug: string, workspaceSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      conversationId,
      labelId,
    }: {
      conversationId: string;
      labelId: string;
    }) => {
      await apiClient.delete(
        `/organizations/${orgSlug}/workspaces/${workspaceSlug}/conversations/${conversationId}/labels/${labelId}`,
      );
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.conversations.detail(variables.conversationId),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.conversations.all(workspaceSlug) });
    },
  });
}

export function useMarkConversationRead(orgSlug: string, workspaceSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (conversationId: string) => {
      await apiClient.post(
        `/organizations/${orgSlug}/workspaces/${workspaceSlug}/conversations/${conversationId}/read`,
      );
    },
    onSuccess: (_data, conversationId) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.conversations.detail(conversationId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.conversations.all(workspaceSlug),
      });
    },
  });
}
