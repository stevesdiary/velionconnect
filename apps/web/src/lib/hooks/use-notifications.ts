'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string | null;
  resourceId: string | null;
  isRead: boolean;
  createdAt: string;
}

const notifKeys = {
  all: () => ['notifications'] as const,
  unreadCount: () => ['notifications', 'unread-count'] as const,
};

export function useNotifications() {
  return useQuery({
    queryKey: notifKeys.all(),
    queryFn: async () => {
      const res = await apiClient.get<{ data: Notification[]; nextCursor: string | null }>(
        '/notifications',
      );
      return res.data;
    },
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: notifKeys.unreadCount(),
    queryFn: async () => {
      const res = await apiClient.get<{ count: number }>('/notifications/unread-count');
      return res.data.count;
    },
    refetchInterval: 30_000,
  });
}

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids?: string[]) => {
      await apiClient.patch('/notifications/read', { ids });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notifKeys.all() });
      void queryClient.invalidateQueries({ queryKey: notifKeys.unreadCount() });
    },
  });
}
