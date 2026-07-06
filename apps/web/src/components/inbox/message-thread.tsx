'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import { format, isSameDay } from 'date-fns';
import { useEffect, useRef, useState } from 'react';

import { useTranslate } from '@/lib/hooks/use-ai';
import { useMessages } from '@/lib/hooks/use-messages';
import type { Message } from '@/lib/hooks/use-messages';

const TRANSLATE_LANGUAGES = [
  'English',
  'French',
  'Spanish',
  'Portuguese',
  'Arabic',
  'Yoruba',
  'Igbo',
  'Hausa',
] as const;

function DateDivider({ date }: { date: Date }) {
  return (
    <div className="my-4 flex items-center gap-3">
      <div className="flex-1 border-t border-gray-200" />
      <span className="text-xs text-gray-400">{format(date, 'MMMM d, yyyy')}</span>
      <div className="flex-1 border-t border-gray-200" />
    </div>
  );
}

function MessageBubble({ message, orgSlug }: { message: Message; orgSlug: string }) {
  const isOutbound = message.direction === 'OUTBOUND';
  const [translation, setTranslation] = useState<string | null>(null);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const translate = useTranslate(orgSlug);

  const handleTranslate = async (targetLanguage: string) => {
    setShowLangMenu(false);
    if (!message.content) return;
    const result = await translate.mutateAsync({ text: message.content, targetLanguage });
    setTranslation(result);
  };

  const canTranslate = !message.isDeleted && !!message.content;

  return (
    <div className={`group flex ${isOutbound ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
          isOutbound
            ? 'rounded-br-sm bg-indigo-600 text-white'
            : 'rounded-bl-sm bg-gray-100 text-gray-900'
        }`}
      >
        {message.replyTo && (
          <div
            className={`mb-2 rounded border-l-2 pl-2 text-xs ${
              isOutbound ? 'border-indigo-300 text-indigo-200' : 'border-gray-400 text-gray-500'
            }`}
          >
            {message.replyTo.content ?? '(attachment)'}
          </div>
        )}
        {message.isDeleted ? (
          <span className="italic opacity-60">Message deleted</span>
        ) : (
          <>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
            {message.attachments.map((att) => (
              <a
                key={att.id}
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`mt-1 block text-xs underline ${isOutbound ? 'text-indigo-200' : 'text-gray-500'}`}
              >
                {att.filename ?? att.type}
              </a>
            ))}
          </>
        )}

        {(translation || translate.isPending) && (
          <div
            className={`mt-2 border-t pt-2 text-sm leading-relaxed ${
              isOutbound ? 'border-indigo-400/50 text-indigo-100' : 'border-gray-300 text-gray-600'
            }`}
          >
            {translate.isPending ? (
              <span className="inline-flex items-center gap-1.5 text-xs opacity-80">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Translating…
              </span>
            ) : (
              <>
                <p className="whitespace-pre-wrap">{translation}</p>
                <button
                  onClick={() => setTranslation(null)}
                  className="mt-1 text-[10px] underline opacity-70 hover:opacity-100"
                >
                  Hide translation
                </button>
              </>
            )}
          </div>
        )}

        <div className={`mt-1 flex items-center gap-1 ${isOutbound ? 'justify-end' : ''}`}>
          {canTranslate && !translation && !translate.isPending && (
            <div className="relative">
              <button
                onClick={() => setShowLangMenu((o) => !o)}
                className={`text-[10px] opacity-0 transition-opacity group-hover:opacity-100 ${
                  isOutbound
                    ? 'text-indigo-200 hover:text-white'
                    : 'text-gray-400 hover:text-gray-700'
                }`}
                title="Translate"
              >
                Translate
              </button>
              {showLangMenu && (
                <div className="absolute bottom-5 left-0 z-50 w-32 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                  {TRANSLATE_LANGUAGES.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => void handleTranslate(lang)}
                      className="block w-full px-3 py-1 text-left text-xs text-gray-700 hover:bg-gray-50"
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <span className={`text-[10px] ${isOutbound ? 'text-indigo-200' : 'text-gray-400'}`}>
            {format(new Date(message.sentAt), 'HH:mm')}
          </span>
          {isOutbound && <StatusIcon status={message.status} />}
        </div>
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'SENDING') {
    return (
      <span className="h-3 w-3 animate-spin rounded-full border border-indigo-200 border-t-transparent" />
    );
  }
  if (status === 'FAILED') {
    return <span className="text-[10px] text-red-300">!</span>;
  }
  if (status === 'READ') {
    return <span className="text-[10px] text-indigo-200">✓✓</span>;
  }
  if (status === 'DELIVERED') {
    return <span className="text-[10px] text-indigo-300">✓✓</span>;
  }
  return <span className="text-[10px] text-indigo-300">✓</span>;
}

export function MessageThread({
  orgSlug,
  conversationId,
}: {
  orgSlug: string;
  conversationId: string;
}) {
  const { data, isLoading } = useMessages(orgSlug, conversationId);
  const messages = data?.data ?? [];
  const parentRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 5,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (!messages.length) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-gray-400">No messages yet</p>
      </div>
    );
  }

  const items = virtualizer.getVirtualItems();

  return (
    <div ref={parentRef} className="absolute inset-0 overflow-y-auto px-4 py-4">
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {items.map((virtualItem) => {
          const message = messages[virtualItem.index];
          if (!message) return null;
          const prev = messages[virtualItem.index - 1];
          const showDate = !prev || !isSameDay(new Date(message.sentAt), new Date(prev.sentAt));

          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              {showDate && <DateDivider date={new Date(message.sentAt)} />}
              <MessageBubble message={message} orgSlug={orgSlug} />
            </div>
          );
        })}
      </div>
      <div ref={bottomRef} />
    </div>
  );
}
