'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';

export interface Label {
  id: string;
  organizationId: string;
  name: string;
  color: string;
  createdAt: string;
}

const labelKeys = {
  all: (orgId: string) => ['labels', orgId] as const,
};

export function useLabels(orgSlug: string) {
  return useQuery({
    queryKey: labelKeys.all(orgSlug),
    queryFn: async () => {
      const res = await apiClient.get<Label[]>(`/organizations/${orgSlug}/labels`);
      return res.data;
    },
    enabled: !!orgSlug,
  });
}

export function useCreateLabel(orgSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: { name: string; color: string }) => {
      const res = await apiClient.post<Label>(`/organizations/${orgSlug}/labels`, dto);
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: labelKeys.all(orgSlug) });
    },
  });
}

export function useDeleteLabel(orgSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (labelId: string) => {
      await apiClient.delete(`/organizations/${orgSlug}/labels/${labelId}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: labelKeys.all(orgSlug) });
    },
  });
}
