'use client';

import { use } from 'react';

import { ConversationList } from '@/components/inbox/conversation-list';

export default function InboxLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string; workspaceSlug: string }>;
}) {
  const { orgSlug, workspaceSlug } = use(params);

  return (
    <div className="flex h-full min-w-0">
      <div className="flex w-72 flex-shrink-0 flex-col border-r border-gray-200 bg-white">
        <ConversationList orgSlug={orgSlug} workspaceSlug={workspaceSlug} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
