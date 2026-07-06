'use client';

import { use, useState } from 'react';

import {
  ConnectedAccount,
  useConnectedAccounts,
  useConnectWhatsApp,
  useDisconnectAccount,
} from '@/lib/hooks/use-connected-accounts';

const META_APP_ID = process.env.NEXT_PUBLIC_META_APP_ID ?? '';
const LINKEDIN_CLIENT_ID = process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID ?? '';

function buildOAuthState(orgSlug: string, platform: string): string {
  const random = Math.random().toString(36).slice(2);
  return btoa(`${orgSlug}::${platform}::${random}`);
}

function getOAuthUrl(
  platform: 'instagram' | 'facebook' | 'linkedin',
  orgSlug: string,
  redirectUri: string,
): string {
  const state = buildOAuthState(orgSlug, platform);
  if (platform === 'instagram') {
    const scope = [
      'instagram_basic',
      'instagram_manage_messages',
      'pages_show_list',
      'pages_messaging',
    ].join(',');
    return `https://www.facebook.com/v19.0/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code&state=${state}`;
  }
  if (platform === 'facebook') {
    const scope = ['pages_messaging', 'pages_show_list', 'pages_manage_metadata'].join(',');
    return `https://www.facebook.com/v19.0/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code&state=${state}`;
  }
  // linkedin
  const scope = ['r_liteprofile', 'r_emailaddress', 'w_member_social'].join('%20');
  return `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`;
}

function ConnectOAuthButton({
  platform,
  label,
  color,
  orgSlug,
}: {
  platform: 'instagram' | 'facebook' | 'linkedin';
  label: string;
  color: string;
  orgSlug: string;
}) {
  const [loading, setLoading] = useState(false);

  function handleConnect() {
    if (!META_APP_ID && platform !== 'linkedin') return;
    if (!LINKEDIN_CLIENT_ID && platform === 'linkedin') return;
    setLoading(true);
    const redirectUri = `${window.location.origin}/oauth/callback`;
    window.location.href = getOAuthUrl(platform, orgSlug, redirectUri);
  }

  const disabled =
    (platform !== 'linkedin' && !META_APP_ID) || (platform === 'linkedin' && !LINKEDIN_CLIENT_ID);

  return (
    <button
      onClick={handleConnect}
      disabled={disabled || loading}
      title={disabled ? 'OAuth credentials not configured' : undefined}
      className="flex w-full items-center gap-3 rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500 transition-colors hover:border-blue-400 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${color}`}
      >
        {label[0]}
      </span>
      {loading ? `Redirecting to ${label}…` : `Connect ${label}`}
    </button>
  );
}

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

export default function ChannelsPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params);
  const { data: accounts, isLoading } = useConnectedAccounts(orgSlug);
  const { mutate: disconnect } = useDisconnectAccount(orgSlug);

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
              {accounts
                ?.filter((a) => a.platform === 'WHATSAPP')
                .map((account) => (
                  <AccountCard key={account.id} account={account} onDisconnect={disconnect} />
                ))}
              <ConnectWhatsAppForm orgSlug={orgSlug} />
            </div>
          </div>

          {/* OAuth platforms */}
          <div>
            <h3 className="mb-3 text-sm font-medium text-gray-700">Instagram</h3>
            <div className="space-y-2">
              {accounts
                ?.filter((a) => a.platform === 'INSTAGRAM')
                .map((account) => (
                  <AccountCard key={account.id} account={account} onDisconnect={disconnect} />
                ))}
              <ConnectOAuthButton
                platform="instagram"
                label="Instagram"
                color="bg-pink-100 text-pink-700"
                orgSlug={orgSlug}
              />
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-medium text-gray-700">Facebook</h3>
            <div className="space-y-2">
              {accounts
                ?.filter((a) => a.platform === 'FACEBOOK')
                .map((account) => (
                  <AccountCard key={account.id} account={account} onDisconnect={disconnect} />
                ))}
              <ConnectOAuthButton
                platform="facebook"
                label="Facebook"
                color="bg-blue-100 text-blue-700"
                orgSlug={orgSlug}
              />
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-medium text-gray-700">LinkedIn</h3>
            <div className="space-y-2">
              {accounts
                ?.filter((a) => a.platform === 'LINKEDIN')
                .map((account) => (
                  <AccountCard key={account.id} account={account} onDisconnect={disconnect} />
                ))}
              <ConnectOAuthButton
                platform="linkedin"
                label="LinkedIn"
                color="bg-sky-100 text-sky-700"
                orgSlug={orgSlug}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
