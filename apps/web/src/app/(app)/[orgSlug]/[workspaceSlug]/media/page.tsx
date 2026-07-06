'use client';

import { use } from 'react';

import { MediaGrid } from '@/components/publish/media-library';
import { useWorkspace } from '@/lib/hooks/use-workspaces';

export default function MediaPage({
  params,
}: {
  params: Promise<{ orgSlug: string; workspaceSlug: string }>;
}) {
  const { orgSlug, workspaceSlug } = use(params);
  const { data: workspace } = useWorkspace(workspaceSlug, orgSlug);

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-gray-900">Media Library</h1>
        <p className="mt-1 text-sm text-gray-500">
          Upload and manage assets to reuse across your posts.
        </p>
      </div>

      <MediaGrid orgSlug={orgSlug} workspaceId={workspace?.id} />
    </div>
  );
}
