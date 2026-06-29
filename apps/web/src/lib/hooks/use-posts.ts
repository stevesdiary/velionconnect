'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';

export interface PostMedia {
  id: string;
  order: number;
  type: string;
  url: string;
  mimeType: string | null;
  width: number | null;
  height: number | null;
  altText: string | null;
}

export interface PostAccount {
  id: string;
  platform: string;
  displayName: string;
}

export type PostStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHING' | 'PUBLISHED' | 'FAILED';

export interface Post {
  id: string;
  organizationId: string;
  workspaceId: string;
  connectedAccountId: string;
  caption: string | null;
  scheduledAt: string | null;
  publishedAt: string | null;
  status: PostStatus;
  platformPostId: string | null;
  platformUrl: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  media: PostMedia[];
  connectedAccount: PostAccount;
}

export function usePosts(
  orgSlug: string,
  workspaceSlug: string,
  filters?: { status?: PostStatus; from?: string; to?: string },
) {
  return useQuery({
    queryKey: [...queryKeys.posts.all(workspaceSlug), filters] as const,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status) params.set('status', filters.status);
      if (filters?.from) params.set('from', filters.from);
      if (filters?.to) params.set('to', filters.to);
      const res = await apiClient.get<Post[]>(
        `/organizations/${orgSlug}/workspaces/${workspaceSlug}/posts?${params}`,
      );
      return res.data;
    },
    enabled: !!orgSlug && !!workspaceSlug,
  });
}

export function usePost(orgSlug: string, workspaceSlug: string, postId: string) {
  return useQuery({
    queryKey: queryKeys.posts.detail(postId),
    queryFn: async () => {
      const res = await apiClient.get<Post>(
        `/organizations/${orgSlug}/workspaces/${workspaceSlug}/posts/${postId}`,
      );
      return res.data;
    },
    enabled: !!postId,
  });
}

export function useCreatePost(orgSlug: string, workspaceSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: {
      connectedAccountId: string;
      caption?: string;
      scheduledAt?: string;
      mediaUrls?: string[];
    }) => {
      const res = await apiClient.post<Post>(
        `/organizations/${orgSlug}/workspaces/${workspaceSlug}/posts`,
        dto,
      );
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.posts.all(workspaceSlug),
      });
    },
  });
}

export function useUpdatePost(orgSlug: string, workspaceSlug: string, postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: {
      caption?: string;
      scheduledAt?: string | null;
      mediaUrls?: string[];
    }) => {
      const res = await apiClient.patch<Post>(
        `/organizations/${orgSlug}/workspaces/${workspaceSlug}/posts/${postId}`,
        dto,
      );
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.posts.detail(postId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.posts.all(workspaceSlug) });
    },
  });
}

export function useDeletePost(orgSlug: string, workspaceSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      await apiClient.delete(
        `/organizations/${orgSlug}/workspaces/${workspaceSlug}/posts/${postId}`,
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.posts.all(workspaceSlug) });
    },
  });
}

export function usePublishNow(orgSlug: string, workspaceSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      const res = await apiClient.post<{ message: string }>(
        `/organizations/${orgSlug}/workspaces/${workspaceSlug}/posts/${postId}/publish`,
      );
      return res.data;
    },
    onSuccess: (_data, postId) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.posts.detail(postId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.posts.all(workspaceSlug) });
    },
  });
}
