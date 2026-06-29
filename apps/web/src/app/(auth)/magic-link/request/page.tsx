'use client';

import Link from 'next/link';
import { useState } from 'react';

import { apiClient } from '@/lib/api-client';

export default function MagicLinkRequestPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await apiClient.post('/auth/magic-link/request', { email });
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <div className="mb-4 text-3xl">✉️</div>
        <h2 className="mb-2 text-xl font-semibold text-gray-900">Check your inbox</h2>
        <p className="text-sm text-gray-500">
          We sent a sign-in link to <strong>{email}</strong>. It expires in 15 minutes.
        </p>
        <button
          onClick={() => setSent(false)}
          className="mt-6 text-sm text-blue-600 hover:underline"
        >
          Try a different email
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
      <h2 className="mb-2 text-xl font-semibold text-gray-900">Sign in with magic link</h2>
      <p className="mb-6 text-sm text-gray-500">
        We&apos;ll email you a link to sign in — no password needed.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send magic link'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-500">
        Prefer a password?{' '}
        <Link href="/login" className="text-blue-600 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
