'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { apiClient } from '@/lib/api-client';
import { useMe } from '@/lib/hooks/use-me';
import { queryKeys } from '@/lib/query-keys';

export default function ProfileSettingsPage() {
  const queryClient = useQueryClient();
  const { data: me } = useMe();
  const [fullName, setFullName] = useState('');
  const [timezone, setTimezone] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (me) {
      setFullName(me.fullName);
      setTimezone(me.timezone);
    }
  }, [me]);

  const updateProfile = useMutation({
    mutationFn: async (data: { fullName: string; timezone: string }) => {
      const res = await apiClient.patch('/users/me', data);
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await updateProfile.mutateAsync({ fullName, timezone });
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="mb-6 text-lg font-semibold text-gray-900">Profile</h2>
      <form onSubmit={handleSubmit} className="max-w-md space-y-5">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Full name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={me?.email ?? ''}
            disabled
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
          />
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
        {updateProfile.isError && <p className="text-sm text-red-600">Failed to update profile.</p>}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={updateProfile.isPending}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {updateProfile.isPending ? 'Saving…' : 'Save changes'}
          </button>
          {saved && <span className="text-sm text-green-600">Saved</span>}
        </div>
      </form>
    </div>
  );
}
