'use client';

import { use } from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { label: 'Profile', href: 'profile' },
  { label: 'Organization', href: 'organization' },
  { label: 'Members', href: 'members' },
  { label: 'Workspaces', href: 'workspaces' },
  { label: 'Channels', href: 'channels' },
  { label: 'Brand Voice', href: 'brand-voice' },
  { label: 'Security', href: 'security' },
];

export default function SettingsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = use(params);
  const pathname = usePathname();

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="mb-8 text-2xl font-bold text-gray-900">Settings</h1>
      <div className="flex gap-8">
        <nav className="w-44 shrink-0">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const href = `/${orgSlug}/settings/${item.href}`;
              const active = pathname === href;
              return (
                <li key={item.href}>
                  <Link
                    href={href}
                    className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      active
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
