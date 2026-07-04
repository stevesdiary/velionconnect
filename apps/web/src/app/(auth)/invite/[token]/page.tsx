'use client';

import { use } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useAcceptInvite, useInviteByToken } from '@/lib/hooks/use-invites';
import { useMe } from '@/lib/hooks/use-me';

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const { data: me } = useMe();
  const { data: invite, isLoading, isError } = useInviteByToken(token);
  const acceptMutation = useAcceptInvite();

  async function handleAccept() {
    await acceptMutation.mutateAsync(token);
    router.push(`/${invite!.organization.slug}/settings/members`);
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-gray-500">Loading invitation…</p>
      </div>
    );
  }

  if (isError || !invite) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <p className="mb-4 text-sm text-red-600">
          This invitation is invalid, expired, or has already been used.
        </p>
        <Link href="/login" className="text-sm text-blue-600 hover:underline">
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
      {invite.organization.avatarUrl && (
        <img
          src={invite.organization.avatarUrl}
          alt={invite.organization.name}
          className="mb-4 h-12 w-12 rounded-lg"
        />
      )}
      <h2 className="mb-1 text-xl font-semibold text-gray-900">
        You&apos;re invited to join {invite.organization.name}
      </h2>
      <p className="mb-6 text-sm text-gray-500">
        You&apos;ve been invited as a <strong>{invite.role.toLowerCase()}</strong>.
      </p>

      {acceptMutation.isError && (
        <p className="mb-4 text-sm text-red-600">
          Failed to accept the invitation. Please try again.
        </p>
      )}

      {me ? (
        <button
          onClick={handleAccept}
          disabled={acceptMutation.isPending}
          className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {acceptMutation.isPending ? 'Accepting…' : 'Accept invitation'}
        </button>
      ) : (
        <div className="space-y-3">
          <Link
            href={`/register?next=/invite/${token}`}
            className="block w-full rounded-lg bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-blue-700"
          >
            Create account to accept
          </Link>
          <Link
            href={`/login?next=/invite/${token}`}
            className="block w-full rounded-lg border border-gray-300 px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Sign in to accept
          </Link>
        </div>
      )}
    </div>
  );
}
