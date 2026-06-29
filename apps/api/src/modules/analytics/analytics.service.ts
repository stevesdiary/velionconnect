import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

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

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getWorkspaceAnalytics(
    orgId: string,
    workspaceSlug: string,
    from: Date,
    to: Date,
  ): Promise<AnalyticsData> {
    const workspace = await this.prisma.workspace.findFirst({
      where: { organizationId: orgId, slug: workspaceSlug, deletedAt: null },
    });
    if (!workspace) throw new NotFoundException('Workspace not found');

    const [conversations, messages, posts] = await Promise.all([
      this.prisma.conversation.findMany({
        where: {
          organizationId: orgId,
          workspaceId: workspace.id,
          deletedAt: null,
          createdAt: { gte: from, lte: to },
        },
        select: { status: true, channel: true, createdAt: true },
      }),
      this.prisma.message.findMany({
        where: {
          organizationId: orgId,
          createdAt: { gte: from, lte: to },
          conversation: { workspaceId: workspace.id, deletedAt: null },
        },
        select: { direction: true, createdAt: true },
      }),
      this.prisma.post.findMany({
        where: {
          organizationId: orgId,
          workspaceId: workspace.id,
          deletedAt: null,
          createdAt: { gte: from, lte: to },
        },
        select: { status: true },
      }),
    ]);

    const summary: AnalyticsSummary = {
      totalConversations: conversations.length,
      openConversations: conversations.filter(
        (c: { status: string }) => c.status === 'OPEN',
      ).length,
      resolvedConversations: conversations.filter(
        (c: { status: string }) => c.status === 'RESOLVED',
      ).length,
      totalMessages: messages.length,
      inboundMessages: messages.filter(
        (m: { direction: string }) => m.direction === 'INBOUND',
      ).length,
      outboundMessages: messages.filter(
        (m: { direction: string }) => m.direction === 'OUTBOUND',
      ).length,
      postsPublished: posts.filter(
        (p: { status: string }) => p.status === 'PUBLISHED',
      ).length,
      postsFailed: posts.filter(
        (p: { status: string }) => p.status === 'FAILED',
      ).length,
      postsScheduled: posts.filter(
        (p: { status: string }) => p.status === 'SCHEDULED',
      ).length,
    };

    const conversationsByDay = this.groupByDay(
      conversations.map((c: { createdAt: Date }) => c.createdAt),
      from,
      to,
    );

    const messagesByDay = this.groupByDay(
      messages.map((m: { createdAt: Date }) => m.createdAt),
      from,
      to,
    );

    const channelMap = new Map<string, number>();
    for (const c of conversations as { channel: string }[]) {
      channelMap.set(c.channel, (channelMap.get(c.channel) ?? 0) + 1);
    }
    const channelBreakdown: ChannelBreakdown[] = Array.from(
      channelMap.entries(),
    )
      .map(([channel, count]) => ({ channel, count }))
      .sort((a, b) => b.count - a.count);

    return { summary, conversationsByDay, messagesByDay, channelBreakdown };
  }

  private groupByDay(dates: Date[], from: Date, to: Date): DailyCount[] {
    const counts = new Map<string, number>();

    // Seed every day in the range with 0
    const cursor = new Date(from);
    cursor.setUTCHours(0, 0, 0, 0);
    const end = new Date(to);
    end.setUTCHours(23, 59, 59, 999);

    while (cursor <= end) {
      counts.set(cursor.toISOString().slice(0, 10), 0);
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    for (const d of dates) {
      const key = d.toISOString().slice(0, 10);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}
