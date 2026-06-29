import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';

export interface AnalyticsSummary {
  totalConversations: number;
  openConversations: number;
  resolvedConversations: number;
  totalMessages: number;
  inboundMessages: number;
  outboundMessages: number;
  postsPublished: number;
  postsFailed: number;
  postsScheduled: number;
}

export interface DailyCount {
  date: string;
  count: number;
}

export interface ChannelBreakdown {
  channel: string;
  count: number;
}

export interface AnalyticsData {
  summary: AnalyticsSummary;
  conversationsByDay: DailyCount[];
  messagesByDay: DailyCount[];
  channelBreakdown: ChannelBreakdown[];
}

export function useAnalytics(orgSlug: string, workspaceSlug: string, from?: string, to?: string) {
  return useQuery<AnalyticsData>({
    queryKey: ['analytics', orgSlug, workspaceSlug, from, to],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const qs = params.toString();
      const res = await apiClient.get<AnalyticsData>(
        `/organizations/${orgSlug}/workspaces/${workspaceSlug}/analytics${qs ? `?${qs}` : ''}`,
      );
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
