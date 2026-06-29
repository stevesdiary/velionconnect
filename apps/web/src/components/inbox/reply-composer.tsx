'use client';

import { useRef, useState } from 'react';

import { useSendMessage } from '@/lib/hooks/use-messages';

export function ReplyComposer({
  orgSlug,
  conversationId,
}: {
  orgSlug: string;
  conversationId: string;
}) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const send = useSendMessage(orgSlug, conversationId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || send.isPending) return;
    send.mutate({ text: trimmed }, { onSuccess: () => setText('') });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      {send.isError && <p className="mb-2 text-xs text-red-500">Failed to send. Try again.</p>}
      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        <div className="flex-1 rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 transition-colors focus-within:border-indigo-400 focus-within:bg-white focus-within:ring-1 focus-within:ring-indigo-400">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a reply… (Enter to send, Shift+Enter for new line)"
            rows={1}
            className="w-full resize-none bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"
            style={{ maxHeight: 120, overflowY: 'auto' }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = 'auto';
              el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
            }}
          />
        </div>

        <button
          type="submit"
          disabled={!text.trim() || send.isPending}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Send"
        >
          {send.isPending ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          )}
        </button>
      </form>
    </div>
  );
}
