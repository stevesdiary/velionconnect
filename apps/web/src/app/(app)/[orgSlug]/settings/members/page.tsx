'use client';

import { useState } from 'react';

import { useCreateInvite, useInvites, useRevokeInvite } from '@/lib/hooks/use-invites';
import { useOrgMembers, useRemoveMember } from '@/lib/hooks/use-organizations';
import { useMe } from '@/lib/hooks/use-me';

const ROLE_OPTIONS = ['ADMIN', 'MEMBER', 'VIEWER'];

export default function MembersSettingsPage({ params }: { params: { orgSlug: string } }) {
  const { orgSlug } = params;
  const { data: me } = useMe();
  const { data: members, isLoading: loadingMembers } = useOrgMembers(orgSlug);
  const { data: invites } = useInvites(orgSlug);
  const removeMember = useRemoveMember(orgSlug);
  const createInvite = useCreateInvite(orgSlug);
  const revokeInvite = useRevokeInvite(orgSlug);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');
  const [inviteError, setInviteError] = useState('');
  const [inviteSent, setInviteSent] = useState(false);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteError('');
    try {
      await createInvite.mutateAsync({ email: inviteEmail, role: inviteRole });
      setInviteEmail('');
      setInviteSent(true);
      setTimeout(() => setInviteSent(false), 3000);
    } catch {
      setInviteError('Failed to send invite. Please try again.');
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-6 text-lg font-semibold text-gray-900">Members</h2>
        {loadingMembers ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {members?.map((member) => (
              <li key={member.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{member.user.fullName}</p>
                  <p className="text-xs text-gray-500">{member.user.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium uppercase text-gray-500">{member.role}</span>
                  {me?.id !== member.user.id && member.role !== 'OWNER' && (
                    <button
                      onClick={() => removeMember.mutate(member.user.id)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Invite member</h2>
        <form onSubmit={handleInvite} className="flex items-end gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
              placeholder="teammate@company.com"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Role</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r.charAt(0) + r.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={createInvite.isPending}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {createInvite.isPending ? 'Sending…' : 'Send invite'}
          </button>
        </form>
        {inviteError && <p className="mt-2 text-sm text-red-600">{inviteError}</p>}
        {inviteSent && <p className="mt-2 text-sm text-green-600">Invite sent!</p>}
      </div>

      {invites && invites.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Pending invites</h2>
          <ul className="divide-y divide-gray-100">
            {invites.map((invite) => (
              <li key={invite.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{invite.email}</p>
                  <p className="text-xs text-gray-500">{invite.role.toLowerCase()}</p>
                </div>
                <button
                  onClick={() => revokeInvite.mutate(invite.id)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Revoke
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
