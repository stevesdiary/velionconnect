'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useCreateOrganization, useUserOrganizations } from '@/lib/hooks/use-organizations';

export default function OnboardingPage() {
  const router = useRouter();
  const { data: orgs, isLoading } = useUserOrganizations();
  const createOrg = useCreateOrganization();
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoading && orgs && orgs.length > 0) {
      router.replace(`/${orgs[0]!.slug}/settings`);
    }
  }, [orgs, isLoading, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const org = await createOrg.mutateAsync({ name });
      router.push(`/${org.slug}/settings`);
    } catch {
      setError('Failed to create organization. Please try again.');
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-sm text-gray-400">Loading…</div>
      </div>
    );
  }

  if (orgs && orgs.length > 0) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Welcome to VelionConnect</h1>
          <p className="mt-1 text-sm text-gray-500">Create your organization to get started</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-xl font-semibold text-gray-900">Name your organization</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Organization name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                maxLength={100}
                placeholder="Acme Marketing Agency"
                autoFocus
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={createOrg.isPending}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {createOrg.isPending ? 'Creating…' : 'Create organization'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
