'use client';

import { use } from 'react';

import { ContactPanel } from '@/components/inbox/contact-panel';
import { MessageThread } from '@/components/inbox/message-thread';
import { ReplyComposer } from '@/components/inbox/reply-composer';
import { ConversationHeader } from '@/components/inbox/conversation-header';
import { useConversation, useMarkConversationRead } from '@/lib/hooks/use-conversations';
import { useMessages } from '@/lib/hooks/use-messages';
import { useEffect } from 'react';

export default function ConversationPage({
  params,
}: {
  params: Promise<{ orgSlug: string; workspaceSlug: string; conversationId: string }>;
}) {
  const { orgSlug, workspaceSlug, conversationId } = use(params);
  const { data: conversation } = useConversation(orgSlug, conversationId);
  const { data: messagesData } = useMessages(orgSlug, conversationId);
  const markRead = useMarkConversationRead(orgSlug, workspaceSlug);

  useEffect(() => {
    if (conversation?.unreadCount && conversation.unreadCount > 0) {
      markRead.mutate(conversationId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, conversation?.unreadCount]);

  return (
    <div className="flex h-full min-w-0">
      <div className="flex min-w-0 flex-1 flex-col">
        <ConversationHeader
          orgSlug={orgSlug}
          workspaceSlug={workspaceSlug}
          conversation={conversation}
          messageCount={messagesData?.data.length}
        />
        <div className="relative min-h-0 flex-1">
          <MessageThread orgSlug={orgSlug} conversationId={conversationId} />
        </div>
        <ReplyComposer orgSlug={orgSlug} conversationId={conversationId} />
      </div>
      {conversation?.contactId && (
        <div className="w-72 flex-shrink-0 overflow-y-auto border-l border-gray-200 bg-white">
          <ContactPanel orgSlug={orgSlug} contactId={conversation.contactId} />
        </div>
      )}
    </div>
  );
}
