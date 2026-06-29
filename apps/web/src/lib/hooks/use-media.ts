'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';

export interface MediaItem {
  id: string;
  organizationId: string;
  workspaceId: string | null;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  thumbnailUrl: string | null;
  width: number | null;
  height: number | null;
  createdAt: string;
}

const mediaKeys = {
  all: (orgId: string) => ['media', orgId] as const,
};

export function useMedia(orgSlug: string, workspaceId?: string) {
  return useQuery({
    queryKey: [...mediaKeys.all(orgSlug), workspaceId] as const,
    queryFn: async () => {
      const params = workspaceId ? `?workspaceId=${workspaceId}` : '';
      const res = await apiClient.get<MediaItem[]>(`/organizations/${orgSlug}/media${params}`);
      return res.data;
    },
    enabled: !!orgSlug,
  });
}

export function useUploadMedia(orgSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, workspaceId }: { file: File; workspaceId?: string }) => {
      const { data: presign } = await apiClient.post<{
        uploadUrl: string;
        key: string;
        publicUrl: string;
      }>(`/organizations/${orgSlug}/media/presign`, {
        mimeType: file.type,
        filename: file.name,
      });

      await fetch(presign.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      const { data: media } = await apiClient.post<MediaItem>(
        `/organizations/${orgSlug}/media/confirm`,
        {
          key: presign.key,
          originalName: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
          workspaceId,
        },
      );

      return { media, publicUrl: presign.publicUrl };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: mediaKeys.all(orgSlug) });
    },
  });
}

export function useDeleteMedia(orgSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (mediaId: string) => {
      await apiClient.delete(`/organizations/${orgSlug}/media/${mediaId}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: mediaKeys.all(orgSlug) });
    },
  });
}
