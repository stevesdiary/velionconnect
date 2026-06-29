'use client';

import { useRef, useState } from 'react';

import { useSendMessage } from '@/lib/hooks/use-messages';
import { useBrandVoices, useRewrite } from '@/lib/hooks/use-ai';
import { useRealtimeStore } from '@/stores/realtime.store';

export function ReplyComposer({
  orgSlug,
  conversationId,
}: {
  orgSlug: string;
  conversationId: string;
}) {
  const [text, setText] = useState('');
  const [showBrandVoice, setShowBrandVoice] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const send = useSendMessage(orgSlug, conversationId);
  const rewrite = useRewrite(orgSlug);
  const { data: brandVoices = [] } = useBrandVoices(orgSlug);
  const { suggestions, clearSuggestions } = useRealtimeStore();
  const currentSuggestions = suggestions[conversationId] ?? [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || send.isPending) return;
    send.mutate(
      { text: trimmed },
      {
        onSuccess: () => {
          setText('');
          clearSuggestions(conversationId);
        },
      },
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const applySuggestion = (suggestion: string) => {
    setText(suggestion);
    clearSuggestions(conversationId);
    textareaRef.current?.focus();
  };

  const handleRewrite = async (brandVoiceId: string) => {
    if (!text.trim()) return;
    const result = await rewrite.mutateAsync({ text, brandVoiceId });
    setText(result);
    setShowBrandVoice(false);
  };

  return (
    <div className="border-t border-gray-200 bg-white">
      {currentSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-2 border-b border-gray-100 px-4 py-2">
          <span className="self-center text-xs text-gray-400">AI:</span>
          {currentSuggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => applySuggestion(s)}
              className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs text-indigo-700 transition-colors hover:bg-indigo-100"
            >
              {s.length > 60 ? `${s.slice(0, 60)}…` : s}
            </button>
          ))}
        </div>
      )}

      <div className="p-4">
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
            {brandVoices.length > 0 && (
              <div className="mt-1.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowBrandVoice(!showBrandVoice)}
                  className="inline-flex items-center gap-1 text-[10px] text-gray-400 hover:text-indigo-600"
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                    />
                  </svg>
                  Brand voice
                </button>
                {showBrandVoice && (
                  <div className="flex flex-wrap gap-1">
                    {brandVoices.map((bv) => (
                      <button
                        key={bv.id}
                        type="button"
                        onClick={() => void handleRewrite(bv.id)}
                        disabled={rewrite.isPending || !text.trim()}
                        className="rounded border border-gray-200 bg-white px-2 py-0.5 text-[10px] text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                      >
                        {rewrite.isPending ? '…' : bv.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
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
    </div>
  );
}
