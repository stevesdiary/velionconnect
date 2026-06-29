'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';

export interface MessageAttachment {
  id: string;
  type: string;
  url: string;
  mimeType: string | null;
  filename: string | null;
}

export interface Message {
  id: string;
  conversationId: string;
  connectedAccountId: string | null;
  platformMessageId: string | null;
  direction: 'INBOUND' | 'OUTBOUND';
  type: string;
  status: 'SENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  content: string | null;
  sentAt: string;
  deliveredAt: string | null;
  readAt: string | null;
  isDeleted: boolean;
  replyToId: string | null;
  replyTo: { id: string; content: string | null; direction: string; type: string } | null;
  attachments: MessageAttachment[];
  createdAt: string;
}

export interface MessagesPage {
  data: Message[];
  nextCursor: string | null;
}

export function useMessages(orgSlug: string, conversationId: string) {
  return useQuery({
    queryKey: queryKeys.messages.all(conversationId),
    queryFn: async () => {
      const res = await apiClient.get<MessagesPage>(
        `/organizations/${orgSlug}/conversations/${conversationId}/messages`,
      );
      return res.data;
    },
    enabled: !!conversationId,
    refetchInterval: 5000, // Poll every 5s until real-time WS is wired up
  });
}

export function useSendMessage(orgSlug: string, conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: {
      text?: string;
      mediaUrl?: string;
      mediaType?: 'image' | 'video' | 'audio' | 'document';
      replyToId?: string;
    }) => {
      const res = await apiClient.post<Message>(
        `/organizations/${orgSlug}/conversations/${conversationId}/messages`,
        dto,
      );
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.messages.all(conversationId),
      });
    },
  });
}
