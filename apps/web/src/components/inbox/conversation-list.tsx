'use client';

import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';

import { useConversationsInfinite } from '@/lib/hooks/use-conversations';

const STATUS_TABS = [
  { value: 'OPEN', label: 'Open' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'RESOLVED', label: 'Resolved' },
] as const;

const CHANNEL_ICONS: Record<string, string> = {
  WHATSAPP: 'W',
  INSTAGRAM: 'IG',
  FACEBOOK: 'FB',
  LINKEDIN: 'IN',
};

function Avatar({ name, url }: { name: string; url: string | null }) {
  if (url) {
    return <img src={url} alt={name} className="h-9 w-9 flex-shrink-0 rounded-full object-cover" />;
  }
  return (
    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export function ConversationList({
  orgSlug,
  workspaceSlug,
}: {
  orgSlug: string;
  workspaceSlug: string;
}) {
  const [status, setStatus] = useState<'OPEN' | 'PENDING' | 'RESOLVED'>('OPEN');
  const params = useParams<{ conversationId?: string }>();
  const activeId = params?.conversationId;

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useConversationsInfinite(orgSlug, workspaceSlug, { status });

  const conversations = data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <>
      <div className="border-b border-gray-100 px-3 pt-3">
        <div className="flex gap-0.5 rounded-lg bg-gray-100 p-0.5">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatus(tab.value)}
              className={`flex-1 rounded-md py-1 text-xs font-medium transition-colors ${
                status === tab.value
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-0">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex gap-3 border-b border-gray-50 px-3 py-3">
                <div className="h-9 w-9 flex-shrink-0 animate-pulse rounded-full bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
                  <div className="h-3 w-40 animate-pulse rounded bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        ) : !conversations.length ? (
          <p className="px-4 py-12 text-center text-sm text-gray-400">
            No {status.toLowerCase()} conversations
          </p>
        ) : (
          <>
            {conversations.map((conv) => (
              <Link
                key={conv.id}
                href={`/${orgSlug}/${workspaceSlug}/inbox/${conv.id}`}
                className={`flex gap-3 border-b border-gray-50 px-3 py-3 transition-colors hover:bg-gray-50 ${
                  activeId === conv.id ? 'bg-indigo-50' : ''
                }`}
              >
                <Avatar name={conv.contact.displayName} url={conv.contact.avatarUrl} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="truncate text-sm font-medium text-gray-900">
                      {conv.contact.displayName}
                    </span>
                    <div className="ml-1 flex flex-shrink-0 items-center gap-1.5">
                      {conv.unreadCount > 0 && (
                        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white">
                          {conv.unreadCount}
                        </span>
                      )}
                      <span className="text-[10px] text-gray-400">
                        {CHANNEL_ICONS[conv.channel] ?? conv.channel}
                      </span>
                    </div>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-gray-500">
                    {conv.lastMessagePreview ?? 'No messages yet'}
                  </p>
                  {conv.labels.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {conv.labels.map((label) => (
                        <span
                          key={label.id}
                          className="rounded-full px-1.5 py-0.5 text-[10px] font-medium text-white"
                          style={{ backgroundColor: label.color }}
                        >
                          {label.name}
                        </span>
                      ))}
                    </div>
                  )}
                  {conv.lastMessageAt && (
                    <p className="mt-0.5 text-[10px] text-gray-400">
                      {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: true })}
                    </p>
                  )}
                </div>
              </Link>
            ))}
            {hasNextPage && (
              <div className="px-3 py-3">
                <button
                  onClick={() => void fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="w-full rounded-md border border-gray-200 py-1.5 text-xs text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  {isFetchingNextPage ? 'Loading…' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
