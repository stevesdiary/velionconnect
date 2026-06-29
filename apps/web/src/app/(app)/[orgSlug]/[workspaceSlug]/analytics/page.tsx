'use client';

import { use, useState } from 'react';

import { useAnalytics, type DailyCount, type ChannelBreakdown } from '@/lib/hooks/use-analytics';

type Range = '7d' | '30d' | '90d';

function getRangeDates(range: Range): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  if (range === '7d') from.setDate(from.getDate() - 6);
  else if (range === '30d') from.setDate(from.getDate() - 29);
  else from.setDate(from.getDate() - 89);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

function StatCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-gray-900">{value.toLocaleString()}</p>
      {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

function BarChart({ data, label }: { data: DailyCount[]; label: string }) {
  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <p className="mb-4 text-sm font-semibold text-gray-700">{label}</p>
      <div className="flex h-32 items-end gap-0.5">
        {data.map((d) => (
          <div key={d.date} className="group relative flex flex-1 flex-col items-center">
            <div
              className="w-full rounded-t bg-indigo-400 transition-all group-hover:bg-indigo-600"
              style={{ height: `${(d.count / max) * 100}%` }}
            />
            <div className="pointer-events-none absolute bottom-full mb-1 hidden rounded bg-gray-900 px-2 py-1 text-xs text-white group-hover:block">
              {d.date}: {d.count}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-xs text-gray-400">
        <span>{data.at(0)?.date?.slice(5) ?? ''}</span>
        <span>{data.at(-1)?.date?.slice(5) ?? ''}</span>
      </div>
    </div>
  );
}

const CHANNEL_LABELS: Record<string, string> = {
  WHATSAPP: 'WhatsApp',
  INSTAGRAM_DM: 'Instagram DM',
  INSTAGRAM_COMMENT: 'Instagram Comments',
  FACEBOOK_MESSENGER: 'Facebook Messenger',
  FACEBOOK_COMMENT: 'Facebook Comments',
  LINKEDIN_DM: 'LinkedIn DM',
  LINKEDIN_COMMENT: 'LinkedIn Comments',
};

function ChannelList({ data }: { data: ChannelBreakdown[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <p className="mb-4 text-sm font-semibold text-gray-700">Channel breakdown</p>
      {data.length === 0 ? (
        <p className="text-sm text-gray-400">No conversations yet</p>
      ) : (
        <div className="space-y-3">
          {data.map((d) => (
            <div key={d.channel}>
              <div className="mb-1 flex justify-between text-xs text-gray-600">
                <span>{CHANNEL_LABELS[d.channel] ?? d.channel}</span>
                <span className="font-semibold">{d.count}</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100">
                <div
                  className="h-2 rounded-full bg-indigo-500"
                  style={{ width: `${(d.count / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AnalyticsPage({
  params,
}: {
  params: Promise<{ orgSlug: string; workspaceSlug: string }>;
}) {
  const { orgSlug, workspaceSlug } = use(params);
  const [range, setRange] = useState<Range>('30d');
  const { from, to } = getRangeDates(range);

  const { data, isLoading } = useAnalytics(orgSlug, workspaceSlug, from, to);

  const rangeOptions: { value: Range; label: string }[] = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
  ];

  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Analytics</h1>
        <div className="flex rounded-lg border border-gray-200 bg-white p-0.5">
          {rangeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRange(opt.value)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                range === opt.value
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-gray-200" />
          ))}
        </div>
      ) : !data ? null : (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <StatCard
              label="Total conversations"
              value={data.summary.totalConversations}
              sub={`${data.summary.openConversations} open · ${data.summary.resolvedConversations} resolved`}
            />
            <StatCard
              label="Total messages"
              value={data.summary.totalMessages}
              sub={`${data.summary.inboundMessages} in · ${data.summary.outboundMessages} out`}
            />
            <StatCard
              label="Posts published"
              value={data.summary.postsPublished}
              sub={`${data.summary.postsScheduled} scheduled · ${data.summary.postsFailed} failed`}
            />
          </div>

          {/* Charts */}
          <div className="grid gap-4 lg:grid-cols-2">
            <BarChart data={data.conversationsByDay} label="Conversations per day" />
            <BarChart data={data.messagesByDay} label="Messages per day" />
          </div>

          {/* Channel breakdown */}
          <ChannelList data={data.channelBreakdown} />
        </div>
      )}
    </div>
  );
}
