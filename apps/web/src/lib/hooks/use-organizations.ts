'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  avatarUrl: string | null;
  timezone: string;
  locale: string;
  currency: string;
  plan: string;
  trialEndsAt: string | null;
  createdAt: string;
}

export interface OrgMember {
  id: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
    lastLoginAt: string | null;
  };
}

export function useUserOrganizations() {
  return useQuery({
    queryKey: queryKeys.organizations.all(),
    queryFn: async () => {
      const res = await apiClient.get<Organization[]>('/users/me/organizations');
      return res.data;
    },
  });
}

export function useOrganization(slug: string) {
  return useQuery({
    queryKey: queryKeys.organizations.detail(slug),
    queryFn: async () => {
      const res = await apiClient.get<Organization>(`/organizations/${slug}`);
      return res.data;
    },
    enabled: !!slug,
  });
}

export function useOrgMembers(orgSlug: string) {
  return useQuery({
    queryKey: queryKeys.organizations.members(orgSlug),
    queryFn: async () => {
      const res = await apiClient.get<OrgMember[]>(`/organizations/${orgSlug}/members`);
      return res.data;
    },
    enabled: !!orgSlug,
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: {
      name: string;
      timezone?: string;
      locale?: string;
      currency?: string;
    }) => {
      const res = await apiClient.post<Organization>('/organizations', dto);
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.organizations.all() });
    },
  });
}

export function useUpdateOrganization(orgSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: {
      name?: string;
      timezone?: string;
      locale?: string;
      currency?: string;
    }) => {
      const res = await apiClient.patch<Organization>(`/organizations/${orgSlug}`, dto);
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.organizations.detail(orgSlug) });
    },
  });
}

export function useUpdateMemberRole(orgSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const res = await apiClient.patch(`/organizations/${orgSlug}/members/${userId}/role`, {
        role,
      });
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.organizations.members(orgSlug) });
    },
  });
}

export function useRemoveMember(orgSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      await apiClient.delete(`/organizations/${orgSlug}/members/${userId}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.organizations.members(orgSlug) });
    },
  });
}
