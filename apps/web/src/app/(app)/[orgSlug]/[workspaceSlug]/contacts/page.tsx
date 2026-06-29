'use client';

import { use } from 'react';

import { useContacts } from '@/lib/hooks/use-contacts';

export default function ContactsPage({
  params,
}: {
  params: Promise<{ orgSlug: string; workspaceSlug: string }>;
}) {
  const { orgSlug } = use(params);
  const { data, isLoading } = useContacts(orgSlug);
  const contacts = data?.data ?? [];

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Contacts</h1>
        <span className="text-sm text-gray-400">{contacts.length} total</span>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border border-gray-100 p-3">
              <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200" />
              <div className="space-y-2">
                <div className="h-3 w-32 animate-pulse rounded bg-gray-200" />
                <div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      ) : contacts.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm text-gray-400">
            No contacts yet. They appear when customers message you.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200">
          {contacts.map((contact, i) => (
            <div
              key={contact.id}
              className={`flex items-center gap-3 px-4 py-3 ${i < contacts.length - 1 ? 'border-b border-gray-100' : ''} hover:bg-gray-50`}
            >
              {contact.avatarUrl ? (
                <img
                  src={contact.avatarUrl}
                  alt={contact.displayName}
                  className="h-10 w-10 flex-shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700">
                  {contact.displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900">{contact.displayName}</p>
                <p className="text-sm text-gray-500">
                  {contact.email ?? contact.phone ?? 'No contact info'}
                </p>
              </div>
              {contact.identities && contact.identities.length > 0 && (
                <div className="flex gap-1">
                  {contact.identities.map((id) => (
                    <span
                      key={id.id}
                      className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600"
                    >
                      {id.platform}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
