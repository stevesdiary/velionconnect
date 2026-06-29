'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useMe } from '@/lib/hooks/use-me';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isLoading, isError } = useMe();

  useEffect(() => {
    if (isError) router.push('/login');
  }, [isError, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-sm text-gray-400">Loading…</div>
      </div>
    );
  }

  if (isError) return null;

  return <>{children}</>;
}
