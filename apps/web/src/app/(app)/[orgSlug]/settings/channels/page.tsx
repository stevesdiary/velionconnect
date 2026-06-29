'use client';

import { useState } from 'react';

import {
  ConnectedAccount,
  useConnectedAccounts,
  useConnectWhatsApp,
  useDisconnectAccount,
} from '@/lib/hooks/use-connected-accounts';

const PLATFORM_LABELS: Record<string, string> = {
  WHATSAPP: 'WhatsApp',
  INSTAGRAM: 'Instagram',
  FACEBOOK: 'Facebook',
  LINKEDIN: 'LinkedIn',
};

const STATUS_COLORS: Record<string, string> = {
  CONNECTED: 'bg-green-100 text-green-700',
  DISCONNECTED: 'bg-gray-100 text-gray-600',
  TOKEN_EXPIRED: 'bg-yellow-100 text-yellow-700',
  ERROR: 'bg-red-100 text-red-700',
};

function AccountCard({
  account,
  onDisconnect,
}: {
  account: ConnectedAccount;
  onDisconnect: (id: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-600">
          {PLATFORM_LABELS[account.platform]?.[0] ?? '?'}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900">{account.displayName}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[account.status] ?? ''}`}
            >
              {account.status.replace('_', ' ')}
            </span>
          </div>
          <p className="text-xs text-gray-500">
            {PLATFORM_LABELS[account.platform]} · {account.username ?? account.platformAccountId}
          </p>
          {account.errorMessage && (
            <p className="mt-0.5 text-xs text-red-600">{account.errorMessage}</p>
          )}
        </div>
      </div>
      <div>
        {confirming ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Disconnect?</span>
            <button
              onClick={() => onDisconnect(account.id)}
              className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
            >
              Yes
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="rounded px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="text-xs font-medium text-gray-500 hover:text-red-600"
          >
            Disconnect
          </button>
        )}
      </div>
    </div>
  );
}

function ConnectWhatsAppForm({ orgSlug }: { orgSlug: string }) {
  const [open, setOpen] = useState(false);
  const [accessToken, setAccessToken] = useState('');
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');

  const { mutateAsync, isPending } = useConnectWhatsApp(orgSlug);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await mutateAsync({ accessToken, phoneNumberId, displayName });
      setOpen(false);
      setAccessToken('');
      setPhoneNumberId('');
      setDisplayName('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Connection failed');
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500 transition-colors hover:border-green-400 hover:text-green-600"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
          WA
        </span>
        Connect WhatsApp
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <h3 className="mb-3 text-sm font-medium text-gray-900">Connect WhatsApp (Meta Cloud API)</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Display Name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g. My Business"
            required
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Phone Number ID</label>
          <input
            type="text"
            value={phoneNumberId}
            onChange={(e) => setPhoneNumberId(e.target.value)}
            placeholder="From Meta Business Manager"
            required
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            System User Access Token
          </label>
          <input
            type="password"
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
            placeholder="Permanent token from Meta"
            required
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? 'Connecting…' : 'Connect'}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default function ChannelsPage({ params }: { params: { orgSlug: string } }) {
  const { orgSlug } = params;
  const { data: accounts, isLoading } = useConnectedAccounts(orgSlug);
  const { mutate: disconnect } = useDisconnectAccount(orgSlug);

  const whatsappAccounts = accounts?.filter((a) => a.platform === 'WHATSAPP') ?? [];
  const otherAccounts = accounts?.filter((a) => a.platform !== 'WHATSAPP') ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Connected Channels</h2>
        <p className="mt-1 text-sm text-gray-500">
          Connect your social accounts to start receiving and sending messages.
        </p>
      </div>

      {isLoading ? (
        <div className="text-sm text-gray-400">Loading channels…</div>
      ) : (
        <div className="space-y-6">
          {/* WhatsApp */}
          <div>
            <h3 className="mb-3 text-sm font-medium text-gray-700">WhatsApp</h3>
            <div className="space-y-2">
              {whatsappAccounts.map((account) => (
                <AccountCard key={account.id} account={account} onDisconnect={disconnect} />
              ))}
              <ConnectWhatsAppForm orgSlug={orgSlug} />
            </div>
          </div>

          {/* Other platforms */}
          {otherAccounts.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-medium text-gray-700">Other Channels</h3>
              <div className="space-y-2">
                {otherAccounts.map((account) => (
                  <AccountCard key={account.id} account={account} onDisconnect={disconnect} />
                ))}
              </div>
            </div>
          )}

          {/* Coming soon: OAuth platforms */}
          <div>
            <h3 className="mb-3 text-sm font-medium text-gray-500">Coming Soon</h3>
            <div className="space-y-2">
              {['Instagram', 'Facebook', 'LinkedIn'].map((name) => (
                <div
                  key={name}
                  className="flex items-center gap-3 rounded-lg border border-dashed border-gray-200 p-4 opacity-50"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">
                    {name[0]}
                  </div>
                  <span className="text-sm text-gray-400">{name} — OAuth coming soon</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
