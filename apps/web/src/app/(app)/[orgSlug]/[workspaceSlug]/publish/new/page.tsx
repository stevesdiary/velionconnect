'use client';

import Link from 'next/link';
import { use } from 'react';

import { PostComposer } from '@/components/publish/post-composer';

export default function NewPostPage({
  params,
}: {
  params: Promise<{ orgSlug: string; workspaceSlug: string }>;
}) {
  const { orgSlug, workspaceSlug } = use(params);

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href={`/${orgSlug}/${workspaceSlug}/publish`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Publishing Studio
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-lg font-semibold text-gray-900">New Post</h1>
      </div>
      <PostComposer orgSlug={orgSlug} workspaceSlug={workspaceSlug} />
    </div>
  );
}
