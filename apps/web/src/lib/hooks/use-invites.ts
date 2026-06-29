'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';

export interface Invite {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  createdAt: string;
}

export interface InviteDetails {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  organization: {
    id: string;
    name: string;
    slug: string;
    avatarUrl: string | null;
  };
}

export function useInvites(orgSlug: string) {
  return useQuery({
    queryKey: ['invites', orgSlug],
    queryFn: async () => {
      const res = await apiClient.get<Invite[]>(`/organizations/${orgSlug}/invites`);
      return res.data;
    },
    enabled: !!orgSlug,
  });
}

export function useCreateInvite(orgSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: { email: string; role?: string }) => {
      const res = await apiClient.post<Invite>(`/organizations/${orgSlug}/invites`, dto);
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['invites', orgSlug] });
    },
  });
}

export function useRevokeInvite(orgSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (inviteId: string) => {
      await apiClient.delete(`/organizations/${orgSlug}/invites/${inviteId}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['invites', orgSlug] });
    },
  });
}

export function useInviteByToken(token: string) {
  return useQuery({
    queryKey: ['invite-token', token],
    queryFn: async () => {
      const res = await apiClient.get<InviteDetails>(`/invites/${token}`);
      return res.data;
    },
    enabled: !!token,
    retry: false,
  });
}

export function useAcceptInvite() {
  return useMutation({
    mutationFn: async (token: string) => {
      const res = await apiClient.post(`/invites/${token}/accept`);
      return res.data;
    },
  });
}
