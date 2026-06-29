'use client';

import Link from 'next/link';
import { use, useState } from 'react';

import { useSearch } from '@/lib/hooks/use-search';

export default function SearchPage({
  params,
}: {
  params: Promise<{ orgSlug: string; workspaceSlug: string }>;
}) {
  const { orgSlug, workspaceSlug } = use(params);
  const [query, setQuery] = useState('');
  const { data, isLoading } = useSearch(orgSlug, query);

  const hasResults =
    (data?.conversations?.length ?? 0) +
      (data?.contacts?.length ?? 0) +
      (data?.messages?.length ?? 0) >
    0;

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <div className="relative mb-6">
        <svg
          className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          autoFocus
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search conversations, contacts, messages..."
          className="w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
        />
        {isLoading && (
          <span className="absolute right-3 top-2.5 h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        )}
      </div>

      {query.trim().length > 1 && !isLoading && !hasResults && (
        <p className="text-center text-sm text-gray-400">No results for &ldquo;{query}&rdquo;</p>
      )}

      {data?.conversations && data.conversations.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
            Conversations
          </h2>
          <div className="space-y-1">
            {data.conversations.map((conv) => (
              <Link
                key={conv.id}
                href={`/${orgSlug}/${workspaceSlug}/inbox/${conv.id}`}
                className="flex items-center gap-3 rounded-lg border border-gray-100 px-3 py-2.5 hover:bg-gray-50"
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                  {conv.contact.displayName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">{conv.contact.displayName}</p>
                  <p className="truncate text-xs text-gray-500">{conv.lastMessagePreview}</p>
                </div>
                <span className="ml-auto text-xs text-gray-400">{conv.channel}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {data?.contacts && data.contacts.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
            Contacts
          </h2>
          <div className="space-y-1">
            {data.contacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center gap-3 rounded-lg border border-gray-100 px-3 py-2.5"
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-700">
                  {contact.displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{contact.displayName}</p>
                  {contact.email && <p className="text-xs text-gray-500">{contact.email}</p>}
                  {contact.phone && <p className="text-xs text-gray-500">{contact.phone}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {data?.messages && data.messages.length > 0 && (
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
            Messages
          </h2>
          <div className="space-y-1">
            {data.messages.map((msg) => (
              <Link
                key={msg.id}
                href={`/${orgSlug}/${workspaceSlug}/inbox/${msg.conversationId}`}
                className="block rounded-lg border border-gray-100 px-3 py-2.5 hover:bg-gray-50"
              >
                <p className="line-clamp-2 text-sm text-gray-900">{msg.content}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
