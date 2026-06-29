'use client';

import { useContact } from '@/lib/hooks/use-contacts';

const PLATFORM_COLORS: Record<string, string> = {
  WHATSAPP: 'bg-green-100 text-green-700',
  INSTAGRAM: 'bg-pink-100 text-pink-700',
  FACEBOOK: 'bg-blue-100 text-blue-700',
  LINKEDIN: 'bg-blue-100 text-blue-800',
  TWITTER: 'bg-sky-100 text-sky-700',
};

export function ContactPanel({ orgSlug, contactId }: { orgSlug: string; contactId: string }) {
  const { data: contact, isLoading } = useContact(orgSlug, contactId);

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="h-14 w-14 animate-pulse rounded-full bg-gray-200" />
          <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
        </div>
      </div>
    );
  }

  if (!contact) return null;

  return (
    <div className="p-4">
      <div className="mb-4 flex flex-col items-center gap-2 text-center">
        {contact.avatarUrl ? (
          <img
            src={contact.avatarUrl}
            alt={contact.displayName}
            className="h-14 w-14 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-xl font-semibold text-indigo-700">
            {contact.displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <h3 className="font-semibold text-gray-900">{contact.displayName}</h3>
          {contact.email && <p className="text-xs text-gray-500">{contact.email}</p>}
          {contact.phone && <p className="text-xs text-gray-500">{contact.phone}</p>}
        </div>
      </div>

      {contact.identities && contact.identities.length > 0 && (
        <section className="mb-4">
          <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
            Connected accounts
          </h4>
          <div className="space-y-1.5">
            {contact.identities.map((identity) => (
              <div key={identity.id} className="flex items-center gap-2">
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${PLATFORM_COLORS[identity.platform] ?? 'bg-gray-100 text-gray-600'}`}
                >
                  {identity.platform}
                </span>
                <span className="truncate text-xs text-gray-600">
                  {identity.platformUsername ?? identity.platformUserId}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {contact.notes && (
        <section>
          <h4 className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
            Notes
          </h4>
          <p className="text-xs leading-relaxed text-gray-600">{contact.notes}</p>
        </section>
      )}

      {contact.timezone && (
        <section className="mt-4">
          <h4 className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
            Timezone
          </h4>
          <p className="text-xs text-gray-600">{contact.timezone}</p>
        </section>
      )}
    </div>
  );
}
