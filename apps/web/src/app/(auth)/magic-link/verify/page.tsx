'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { startTransition, useEffect, useState } from 'react';

import { apiClient } from '@/lib/api-client';

export default function MagicLinkVerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      startTransition(() => setError('Invalid link — no token found.'));
      return;
    }

    apiClient
      .post('/auth/magic-link/verify', { token })
      .then(() => router.push('/onboarding'))
      .catch(() =>
        startTransition(() =>
          setError('This link is invalid or has expired. Please request a new one.'),
        ),
      );
  }, [token, router]);

  if (error) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <p className="mb-4 text-sm text-red-600">{error}</p>
        <Link href="/magic-link/request" className="text-sm text-blue-600 hover:underline">
          Request a new magic link
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
      <div className="animate-pulse text-sm text-gray-500">Verifying your link…</div>
    </div>
  );
}
