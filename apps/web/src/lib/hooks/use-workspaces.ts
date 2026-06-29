'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  avatarUrl: string | null;
  timezone: string | null;
  createdAt: string;
}

export function useWorkspaces(orgSlug: string) {
  return useQuery({
    queryKey: ['workspaces', orgSlug],
    queryFn: async () => {
      const res = await apiClient.get<Workspace[]>(`/organizations/${orgSlug}/workspaces`);
      return res.data;
    },
    enabled: !!orgSlug,
  });
}

export function useCreateWorkspace(orgSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: { name: string; description?: string }) => {
      const res = await apiClient.post<Workspace>(`/organizations/${orgSlug}/workspaces`, dto);
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['workspaces', orgSlug] });
    },
  });
}

export function useDeleteWorkspace(orgSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (workspaceSlug: string) => {
      await apiClient.delete(`/organizations/${orgSlug}/workspaces/${workspaceSlug}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['workspaces', orgSlug] });
    },
  });
}
