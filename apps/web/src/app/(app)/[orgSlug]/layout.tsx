'use client';

import { usePathname } from 'next/navigation';

import { useOrganization } from '@/lib/hooks/use-organizations';

export default function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { orgSlug: string };
}) {
  const { orgSlug } = params;
  const { data: org } = useOrganization(orgSlug);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-900">{org?.name ?? orgSlug}</span>
          {pathname.includes('/settings') && (
            <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Settings
            </span>
          )}
        </div>
        <a
          href="/login"
          onClick={async (e) => {
            e.preventDefault();
            const { apiClient } = await import('@/lib/api-client');
            await apiClient.post('/auth/logout').catch(() => null);
            window.location.href = '/login';
          }}
          className="text-sm text-gray-500 hover:text-gray-900"
        >
          Sign out
        </a>
      </header>
      {children}
    </div>
  );
}
