'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

import { apiClient } from '@/lib/api-client';

function TwoFactorVerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tempToken = searchParams.get('tempToken') ?? '';

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!tempToken) {
    router.replace('/login');
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiClient.post('/auth/2fa/verify', { tempToken, code });
      router.push('/onboarding');
    } catch {
      setError('Invalid or expired code. Please try again.');
      setCode('');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
      <div className="mb-6">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
          <svg
            className="h-6 w-6 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Two-factor authentication</h2>
        <p className="mt-1 text-sm text-gray-500">
          Open your authenticator app and enter the 6-digit code.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Authentication code
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            required
            autoFocus
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-center font-mono text-xl tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading || code.length !== 6}
          className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Verifying...' : 'Verify'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-500">
        <Link href="/login" className="text-blue-600 hover:underline">
          Back to login
        </Link>
      </p>
    </div>
  );
}

export default function TwoFactorVerifyPage() {
  return (
    <Suspense>
      <TwoFactorVerifyForm />
    </Suspense>
  );
}
