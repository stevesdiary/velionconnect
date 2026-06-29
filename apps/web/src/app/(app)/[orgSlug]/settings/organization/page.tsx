'use client';

import { useEffect, useState } from 'react';

import { useOrganization, useUpdateOrganization } from '@/lib/hooks/use-organizations';

export default function OrganizationSettingsPage({ params }: { params: { orgSlug: string } }) {
  const { orgSlug } = params;
  const { data: org } = useOrganization(orgSlug);
  const updateOrg = useUpdateOrganization(orgSlug);
  const [name, setName] = useState('');
  const [timezone, setTimezone] = useState('');
  const [locale, setLocale] = useState('');
  const [currency, setCurrency] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (org) {
      setName(org.name);
      setTimezone(org.timezone);
      setLocale(org.locale);
      setCurrency(org.currency);
    }
  }, [org]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await updateOrg.mutateAsync({ name, timezone, locale, currency });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="mb-6 text-lg font-semibold text-gray-900">Organization</h2>
      <form onSubmit={handleSubmit} className="max-w-md space-y-5">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
            maxLength={100}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Slug</label>
          <input
            value={org?.slug ?? ''}
            disabled
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
          />
          <p className="mt-1 text-xs text-gray-400">Slug cannot be changed after creation.</p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Timezone</label>
          <input
            type="text"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            placeholder="Africa/Lagos"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Locale</label>
            <input
              type="text"
              value={locale}
              onChange={(e) => setLocale(e.target.value)}
              placeholder="en-NG"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Currency</label>
            <input
              type="text"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              placeholder="NGN"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        {updateOrg.isError && (
          <p className="text-sm text-red-600">Failed to update organization.</p>
        )}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={updateOrg.isPending}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {updateOrg.isPending ? 'Saving…' : 'Save changes'}
          </button>
          {saved && <span className="text-sm text-green-600">Saved</span>}
        </div>
      </form>
    </div>
  );
}
