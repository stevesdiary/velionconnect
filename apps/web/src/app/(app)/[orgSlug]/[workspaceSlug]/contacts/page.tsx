'use client';

import { use, useState } from 'react';

import { useContacts, useMergeContacts, type Contact } from '@/lib/hooks/use-contacts';

function MergeDialog({
  contact,
  contacts,
  orgSlug,
  onClose,
}: {
  contact: Contact;
  contacts: Contact[];
  orgSlug: string;
  onClose: () => void;
}) {
  const [targetId, setTargetId] = useState('');
  const merge = useMergeContacts(orgSlug);

  const candidates = contacts.filter((c) => c.id !== contact.id);

  const handleMerge = async () => {
    if (!targetId) return;
    await merge.mutateAsync({ sourceId: contact.id, targetId });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-1 text-lg font-semibold text-gray-900">Merge contact</h2>
        <p className="mb-4 text-sm text-gray-500">
          Merge <span className="font-medium">{contact.displayName}</span> into another contact. All
          conversations and identities will be transferred.
        </p>

        <label className="mb-1 block text-xs font-medium text-gray-700">Merge into</label>
        <select
          value={targetId}
          onChange={(e) => setTargetId(e.target.value)}
          className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-400"
        >
          <option value="">Select a contact…</option>
          {candidates.map((c) => (
            <option key={c.id} value={c.id}>
              {c.displayName}
              {c.email ? ` — ${c.email}` : ''}
              {c.phone ? ` — ${c.phone}` : ''}
            </option>
          ))}
        </select>

        {merge.isError && (
          <p className="mb-3 text-sm text-red-600">
            {merge.error instanceof Error ? merge.error.message : 'Merge failed'}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={() => void handleMerge()}
            disabled={!targetId || merge.isPending}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {merge.isPending ? 'Merging…' : 'Merge'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ContactsPage({
  params,
}: {
  params: Promise<{ orgSlug: string; workspaceSlug: string }>;
}) {
  const { orgSlug } = use(params);
  const { data, isLoading } = useContacts(orgSlug);
  const contacts = data?.data ?? [];
  const [mergingContact, setMergingContact] = useState<Contact | null>(null);

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
              className={`group flex items-center gap-3 px-4 py-3 ${i < contacts.length - 1 ? 'border-b border-gray-100' : ''} hover:bg-gray-50`}
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
              <button
                onClick={() => setMergingContact(contact)}
                className="ml-2 hidden rounded-md px-2 py-1 text-xs text-gray-400 hover:bg-gray-100 hover:text-gray-700 group-hover:block"
                title="Merge contact"
              >
                Merge
              </button>
            </div>
          ))}
        </div>
      )}

      {mergingContact && (
        <MergeDialog
          contact={mergingContact}
          contacts={contacts}
          orgSlug={orgSlug}
          onClose={() => setMergingContact(null)}
        />
      )}
    </div>
  );
}
