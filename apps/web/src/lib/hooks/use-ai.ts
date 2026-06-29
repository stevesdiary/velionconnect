'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';

export interface BrandVoice {
  id: string;
  organizationId: string;
  name: string;
  tone: string;
  examples: string[];
  instructions: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

const aiKeys = {
  brandVoices: (orgSlug: string) => ['ai', 'brand-voices', orgSlug] as const,
};

export function useBrandVoices(orgSlug: string) {
  return useQuery({
    queryKey: aiKeys.brandVoices(orgSlug),
    queryFn: async () => {
      const res = await apiClient.get<BrandVoice[]>(`/organizations/${orgSlug}/ai/brand-voices`);
      return res.data;
    },
    enabled: !!orgSlug,
  });
}

export function useCreateBrandVoice(orgSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      tone: string;
      examples: string[];
      instructions?: string;
      isDefault?: boolean;
    }) => {
      const res = await apiClient.post<BrandVoice>(
        `/organizations/${orgSlug}/ai/brand-voices`,
        data,
      );
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: aiKeys.brandVoices(orgSlug) });
    },
  });
}

export function useDeleteBrandVoice(orgSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/organizations/${orgSlug}/ai/brand-voices/${id}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: aiKeys.brandVoices(orgSlug) });
    },
  });
}

export function useSummarize(orgSlug: string) {
  return useMutation({
    mutationFn: async (conversationId: string) => {
      const res = await apiClient.post<{ summary: string }>(
        `/organizations/${orgSlug}/ai/summarize`,
        { conversationId },
      );
      return res.data.summary;
    },
  });
}

export function useRewrite(orgSlug: string) {
  return useMutation({
    mutationFn: async ({ text, brandVoiceId }: { text: string; brandVoiceId?: string }) => {
      const res = await apiClient.post<{ text: string }>(`/organizations/${orgSlug}/ai/rewrite`, {
        text,
        brandVoiceId,
      });
      return res.data.text;
    },
  });
}

export function useTranslate(orgSlug: string) {
  return useMutation({
    mutationFn: async ({ text, targetLanguage }: { text: string; targetLanguage: string }) => {
      const res = await apiClient.post<{ text: string }>(`/organizations/${orgSlug}/ai/translate`, {
        text,
        targetLanguage,
      });
      return res.data.text;
    },
  });
}

export function useGenerateHashtags(orgSlug: string) {
  return useMutation({
    mutationFn: async ({ caption, platform }: { caption: string; platform: string }) => {
      const res = await apiClient.post<{ hashtags: string[] }>(
        `/organizations/${orgSlug}/ai/hashtags`,
        { caption, platform },
      );
      return res.data.hashtags;
    },
  });
}

export function useOptimizeForPlatform(orgSlug: string) {
  return useMutation({
    mutationFn: async ({ caption, platform }: { caption: string; platform: string }) => {
      const res = await apiClient.post<{ caption: string }>(
        `/organizations/${orgSlug}/ai/optimize`,
        { caption, platform },
      );
      return res.data.caption;
    },
  });
}
