'use client';

import { useRef } from 'react';

import { useDeleteMedia, useMedia, useUploadMedia, type MediaItem } from '@/lib/hooks/use-media';

/**
 * Modal wrapper around MediaGrid for picking existing assets when composing a
 * post. Calls `onSelect` with the chosen item's URL and closes.
 */
export function MediaLibraryPicker({
  orgSlug,
  workspaceId,
  selectedUrls,
  onSelect,
  onClose,
}: {
  orgSlug: string;
  workspaceId?: string;
  selectedUrls: string[];
  onSelect: (url: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="flex max-h-[80vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-gray-900">Choose from library</h2>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100">
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto p-5">
          <MediaGrid
            orgSlug={orgSlug}
            workspaceId={workspaceId}
            selectedUrls={selectedUrls}
            onSelect={(item) => onSelect(item.url)}
          />
        </div>
        <div className="flex justify-end border-t border-gray-100 px-5 py-3">
          <button
            onClick={onClose}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isVideo(item: MediaItem): boolean {
  return item.mimeType.startsWith('video/');
}

/**
 * Shared media grid used both by the standalone library page and the picker
 * modal. When `onSelect` is provided the tiles become selectable; otherwise
 * the grid shows management actions (delete).
 */
export function MediaGrid({
  orgSlug,
  workspaceId,
  onSelect,
  selectedUrls,
}: {
  orgSlug: string;
  workspaceId?: string;
  onSelect?: (item: MediaItem) => void;
  selectedUrls?: string[];
}) {
  const { data: media = [], isLoading } = useMedia(orgSlug, workspaceId);
  const uploadMedia = useUploadMedia(orgSlug);
  const deleteMedia = useDeleteMedia(orgSlug);
  const fileInput = useRef<HTMLInputElement>(null);

  const handleUpload = async (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      await uploadMedia.mutateAsync({ file, workspaceId });
    }
    if (fileInput.current) fileInput.current.value = '';
  };

  const selected = new Set(selectedUrls ?? []);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {isLoading ? 'Loading…' : `${media.length} item${media.length === 1 ? '' : 's'}`}
        </p>
        <label className="cursor-pointer rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700">
          <input
            ref={fileInput}
            type="file"
            className="sr-only"
            accept="image/*,video/*"
            multiple
            onChange={(e) => void handleUpload(e.target.files)}
          />
          {uploadMedia.isPending ? 'Uploading…' : 'Upload'}
        </label>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      ) : media.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center">
          <p className="text-sm text-gray-400">
            No media yet. Upload images or videos to reuse them across posts.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          {media.map((item) => {
            const isSelected = selected.has(item.url);
            return (
              <div
                key={item.id}
                className={`group relative aspect-square overflow-hidden rounded-lg border bg-gray-50 ${
                  isSelected ? 'border-indigo-500 ring-2 ring-indigo-500' : 'border-gray-200'
                } ${onSelect ? 'cursor-pointer' : ''}`}
                onClick={onSelect ? () => onSelect(item) : undefined}
              >
                {isVideo(item) ? (
                  <div className="flex h-full w-full items-center justify-center bg-gray-800">
                    <svg className="h-8 w-8 text-white/70" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6.3 2.8A1 1 0 004.8 3.6v12.8a1 1 0 001.5.9l10.4-6.4a1 1 0 000-1.7L6.3 2.8z" />
                    </svg>
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.thumbnailUrl ?? item.url}
                    alt={item.originalName}
                    className="h-full w-full object-cover"
                  />
                )}

                {isSelected && (
                  <div className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white">
                    <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}

                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <p className="truncate text-[10px] text-white">{item.originalName}</p>
                  <p className="text-[10px] text-white/70">{formatBytes(item.sizeBytes)}</p>
                </div>

                {!onSelect && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (
                        confirm(
                          'Delete this media? It will not be removed from already-published posts.',
                        )
                      ) {
                        deleteMedia.mutate(item.id);
                      }
                    }}
                    className="absolute right-1.5 top-1.5 hidden rounded-full bg-gray-900/70 p-1 text-white hover:bg-red-600 group-hover:block"
                    title="Delete"
                  >
                    <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
