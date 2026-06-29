'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';

export interface ConnectedAccount {
  id: string;
  organizationId: string;
  workspaceId: string | null;
  platform: 'WHATSAPP' | 'INSTAGRAM' | 'FACEBOOK' | 'LINKEDIN';
  platformAccountId: string;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
  status: 'CONNECTED' | 'DISCONNECTED' | 'TOKEN_EXPIRED' | 'ERROR';
  scopes: string[];
  metadata: Record<string, unknown>;
  lastSyncAt: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export function useConnectedAccounts(orgSlug: string) {
  return useQuery({
    queryKey: queryKeys.connectedAccounts.all(orgSlug),
    queryFn: async () => {
      const res = await apiClient.get<ConnectedAccount[]>(
        `/organizations/${orgSlug}/connected-accounts`,
      );
      return res.data;
    },
    enabled: !!orgSlug,
  });
}

export function useConnectWhatsApp(orgSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: {
      accessToken: string;
      phoneNumberId: string;
      displayName: string;
      workspaceId?: string;
    }) => {
      const res = await apiClient.post<ConnectedAccount>(
        `/organizations/${orgSlug}/connected-accounts/whatsapp`,
        dto,
      );
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.connectedAccounts.all(orgSlug),
      });
    },
  });
}

export function useConnectOAuth(orgSlug: string, platform: 'instagram' | 'facebook' | 'linkedin') {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: { code: string; redirectUri: string; workspaceId?: string }) => {
      const res = await apiClient.post<ConnectedAccount>(
        `/organizations/${orgSlug}/connected-accounts/${platform}/oauth`,
        dto,
      );
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.connectedAccounts.all(orgSlug),
      });
    },
  });
}

export function useDisconnectAccount(orgSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (accountId: string) => {
      await apiClient.delete(`/organizations/${orgSlug}/connected-accounts/${accountId}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.connectedAccounts.all(orgSlug),
      });
    },
  });
}
