'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { io } from 'socket.io-client';

import { queryKeys } from '@/lib/query-keys';
import { useRealtimeStore } from '@/stores/realtime.store';

export function useRealtime(workspaceId?: string) {
  const { setSocket, setConnected, setSuggestions } = useRealtimeStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    const baseUrl = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001';
    const socket = io(`${baseUrl}/realtime`, {
      path: '/socket.io',
      withCredentials: true,
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      setConnected(true);
      setSocket(socket);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('message:new', (data: { conversationId: string }) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.messages.all(data.conversationId),
      });
      if (workspaceId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.conversations.all(workspaceId),
        });
      }
    });

    socket.on('conversation:new', () => {
      if (workspaceId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.conversations.all(workspaceId),
        });
      }
    });

    socket.on('conversation:updated', (data: { conversationId: string }) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.conversations.detail(data.conversationId),
      });
      if (workspaceId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.conversations.all(workspaceId),
        });
      }
    });

    socket.on('notification:new', () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });

    socket.on(
      'suggestion:ready',
      (data: { messageId: string; conversationId: string; suggestions: string[] }) => {
        setSuggestions(data.conversationId, data.suggestions);
      },
    );

    return () => {
      socket.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, [workspaceId, queryClient, setSocket, setConnected, setSuggestions]);
}
