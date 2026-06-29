'use client';

import { useState } from 'react';

import type { Conversation } from '@/lib/hooks/use-conversations';
import { useUpdateConversation } from '@/lib/hooks/use-conversations';
import { useSummarize } from '@/lib/hooks/use-ai';

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-green-100 text-green-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  RESOLVED: 'bg-gray-100 text-gray-600',
  ARCHIVED: 'bg-gray-100 text-gray-500',
};

export function ConversationHeader({
  orgSlug,
  workspaceSlug,
  conversation,
  messageCount,
}: {
  orgSlug: string;
  workspaceSlug: string;
  conversation: Conversation | undefined;
  messageCount?: number;
}) {
  const [summary, setSummary] = useState<string | null>(null);
  const update = useUpdateConversation(orgSlug, workspaceSlug);
  const summarize = useSummarize(orgSlug);

  if (!conversation) {
    return (
      <div className="flex h-14 items-center border-b border-gray-200 bg-white px-4">
        <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
      </div>
    );
  }

  const canResolve = conversation.status === 'OPEN' || conversation.status === 'PENDING';
  const canReopen = conversation.status === 'RESOLVED' || conversation.status === 'ARCHIVED';
  const canSummarize = (messageCount ?? 0) >= 10;

  const handleSummarize = async () => {
    const result = await summarize.mutateAsync(conversation.id);
    setSummary(result);
  };

  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-gray-900">{conversation.contact.displayName}</span>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[conversation.status] ?? ''}`}
          >
            {conversation.status.charAt(0) + conversation.status.slice(1).toLowerCase()}
          </span>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
            {conversation.channel}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {canSummarize && (
            <button
              onClick={() => void handleSummarize()}
              disabled={summarize.isPending}
              className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              title="Summarize conversation"
            >
              {summarize.isPending ? (
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
              ) : (
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              )}
              Summarize
            </button>
          )}

          <button
            onClick={() =>
              update.mutate({
                conversationId: conversation.id,
                data: { isStarred: !conversation.isStarred },
              })
            }
            className={`rounded p-1 ${conversation.isStarred ? 'text-yellow-500' : 'text-gray-400 hover:text-gray-600'}`}
            title={conversation.isStarred ? 'Unstar' : 'Star'}
          >
            <svg
              className="h-4 w-4"
              fill={conversation.isStarred ? 'currentColor' : 'none'}
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
          </button>

          {canResolve && (
            <button
              onClick={() =>
                update.mutate({ conversationId: conversation.id, data: { status: 'RESOLVED' } })
              }
              disabled={update.isPending}
              className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              Resolve
            </button>
          )}
          {canReopen && (
            <button
              onClick={() =>
                update.mutate({ conversationId: conversation.id, data: { status: 'OPEN' } })
              }
              disabled={update.isPending}
              className="rounded-md bg-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-300 disabled:opacity-50"
            >
              Reopen
            </button>
          )}
        </div>
      </div>

      {summary && (
        <div className="border-t border-indigo-100 bg-indigo-50 px-4 py-2 text-xs text-indigo-800">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="font-medium">Summary: </span>
              {summary}
            </div>
            <button
              onClick={() => setSummary(null)}
              className="flex-shrink-0 text-indigo-400 hover:text-indigo-600"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
