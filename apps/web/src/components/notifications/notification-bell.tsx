'use client';

import { useRef, useState } from 'react';

import {
  useMarkNotificationsRead,
  useNotifications,
  useUnreadNotificationCount,
} from '@/lib/hooks/use-notifications';
import { useOnClickOutside } from '@/lib/hooks/use-click-outside';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function NotificationBell({ orgSlug: _ }: { orgSlug: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data: count = 0 } = useUnreadNotificationCount();
  const { data: notifications } = useNotifications();
  const markRead = useMarkNotificationsRead();

  useOnClickOutside(ref, () => setOpen(false));

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => {
          setOpen((o) => !o);
          if (!open && count > 0) markRead.mutate(undefined);
        }}
        className="relative rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
        aria-label="Notifications"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-50 w-80 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="border-b border-gray-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {!notifications?.data?.length ? (
              <p className="px-4 py-8 text-center text-sm text-gray-400">All caught up</p>
            ) : (
              notifications.data.map((n) => (
                <div
                  key={n.id}
                  className={`border-b border-gray-50 px-4 py-3 last:border-0 ${!n.isRead ? 'bg-indigo-50/40' : ''}`}
                >
                  <p className="text-sm font-medium text-gray-900">{n.title}</p>
                  {n.body && <p className="mt-0.5 text-xs text-gray-500">{n.body}</p>}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
