'use client';

import { Suspense, useEffect, useRef, useState } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { apiClient } from '@/lib/api-client';

function OAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState('');
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const code = searchParams.get('code');
    const rawState = searchParams.get('state');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError(`Authorization denied: ${errorParam}`);
      return;
    }

    if (!code || !rawState) {
      setError('Missing OAuth parameters.');
      return;
    }

    let orgSlug: string;
    let platform: string;

    try {
      const decoded = atob(rawState);
      const parts = decoded.split('::');
      orgSlug = parts[0];
      platform = parts[1];
      if (!orgSlug || !platform) throw new Error('bad state');
    } catch {
      setError('Invalid OAuth state parameter.');
      return;
    }

    const redirectUri = `${window.location.origin}/oauth/callback`;

    apiClient
      .post(`/organizations/${orgSlug}/connected-accounts/${platform.toLowerCase()}/oauth`, {
        code,
        redirectUri,
      })
      .then(() => {
        router.replace(`/${orgSlug}/settings/channels`);
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Failed to complete connection.';
        setError(msg);
      });
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <p className="mb-4 text-sm text-red-600">{error}</p>
          <button onClick={() => router.back()} className="text-sm text-blue-600 hover:underline">
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <div className="mb-3 flex justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
        <p className="text-sm text-gray-500">Completing connection…</p>
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      }
    >
      <OAuthCallbackContent />
    </Suspense>
  );
}
