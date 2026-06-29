'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { AuthUser, useAuthStore } from '@/stores/auth.store';

export function useMe() {
  const { setUser } = useAuthStore();

  const query = useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: async () => {
      const res = await apiClient.get<AuthUser>('/auth/me');
      return res.data;
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (query.data) setUser(query.data);
  }, [query.data, setUser]);

  return query;
}
