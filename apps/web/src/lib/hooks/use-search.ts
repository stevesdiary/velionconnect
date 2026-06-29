'use client';

import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import type { Contact } from './use-contacts';
import type { Conversation } from './use-conversations';
import type { Message } from './use-messages';

export interface SearchResults {
  conversations: Conversation[];
  contacts: Contact[];
  messages: Message[];
}

export function useSearch(orgSlug: string, query: string) {
  return useQuery({
    queryKey: ['search', orgSlug, query],
    queryFn: async () => {
      const res = await apiClient.get<SearchResults>(
        `/organizations/${orgSlug}/search?q=${encodeURIComponent(query)}`,
      );
      return res.data;
    },
    enabled: !!orgSlug && query.trim().length > 1,
    staleTime: 10 * 1000,
  });
}
