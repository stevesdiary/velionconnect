'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import { format, isSameDay } from 'date-fns';
import { useEffect, useRef } from 'react';

import { useMessages } from '@/lib/hooks/use-messages';
import type { Message } from '@/lib/hooks/use-messages';

function DateDivider({ date }: { date: Date }) {
  return (
    <div className="my-4 flex items-center gap-3">
      <div className="flex-1 border-t border-gray-200" />
      <span className="text-xs text-gray-400">{format(date, 'MMMM d, yyyy')}</span>
      <div className="flex-1 border-t border-gray-200" />
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isOutbound = message.direction === 'OUTBOUND';

  return (
    <div className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}>
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
        <div className={`mt-1 flex items-center gap-1 ${isOutbound ? 'justify-end' : ''}`}>
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
              <MessageBubble message={message} />
            </div>
          );
        })}
      </div>
      <div ref={bottomRef} />
    </div>
  );
}
