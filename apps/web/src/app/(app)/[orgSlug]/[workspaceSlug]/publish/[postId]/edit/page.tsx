'use client';

import Link from 'next/link';
import { use } from 'react';

import { PostComposer } from '@/components/publish/post-composer';
import { usePost } from '@/lib/hooks/use-posts';

export default function EditPostPage({
  params,
}: {
  params: Promise<{ orgSlug: string; workspaceSlug: string; postId: string }>;
}) {
  const { orgSlug, workspaceSlug, postId } = use(params);
  const { data: post, isLoading } = usePost(orgSlug, workspaceSlug, postId);

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
        <h1 className="text-lg font-semibold text-gray-900">Edit Post</h1>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      ) : post ? (
        <PostComposer orgSlug={orgSlug} workspaceSlug={workspaceSlug} editPost={post} />
      ) : (
        <p className="text-sm text-gray-500">Post not found.</p>
      )}
    </div>
  );
}
