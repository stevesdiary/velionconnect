'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';

export interface ContactIdentity {
  id: string;
  platform: string;
  platformUserId: string;
  platformUsername: string | null;
  platformAvatarUrl: string | null;
}

export interface Contact {
  id: string;
  organizationId: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  notes: string | null;
  timezone: string | null;
  locale: string | null;
  createdAt: string;
  identities?: ContactIdentity[];
}

export function useContact(orgSlug: string, contactId: string) {
  return useQuery({
    queryKey: queryKeys.contacts.detail(contactId),
    queryFn: async () => {
      const res = await apiClient.get<Contact>(`/organizations/${orgSlug}/contacts/${contactId}`);
      return res.data;
    },
    enabled: !!contactId,
  });
}

export function useContacts(orgSlug: string, workspaceId?: string) {
  return useQuery({
    queryKey: queryKeys.contacts.all(workspaceId ?? orgSlug),
    queryFn: async () => {
      const res = await apiClient.get<{ data: Contact[]; nextCursor: string | null }>(
        `/organizations/${orgSlug}/contacts`,
      );
      return res.data;
    },
    enabled: !!orgSlug,
  });
}

export function useMergeContacts(orgSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ sourceId, targetId }: { sourceId: string; targetId: string }) => {
      const res = await apiClient.post<Contact>(
        `/organizations/${orgSlug}/contacts/${sourceId}/merge/${targetId}`,
      );
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all(orgSlug) });
    },
  });
}
