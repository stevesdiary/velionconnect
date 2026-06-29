'use client';

import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useConnectedAccounts } from '@/lib/hooks/use-connected-accounts';
import { useUploadMedia } from '@/lib/hooks/use-media';
import { useCreatePost, useUpdatePost, type Post } from '@/lib/hooks/use-posts';
import { useGenerateHashtags, useOptimizeForPlatform } from '@/lib/hooks/use-ai';
import { PLATFORM_LIMITS, validatePost } from '@/lib/platform-limits';

interface PostComposerProps {
  orgSlug: string;
  workspaceSlug: string;
  editPost?: Post;
}

function CharCounter({ text, limit }: { text: string; limit: number | null }) {
  if (!limit) return null;
  const remaining = limit - text.length;
  const pct = text.length / limit;
  return (
    <span
      className={`text-xs tabular-nums ${
        pct >= 1 ? 'text-red-500' : pct >= 0.9 ? 'text-yellow-600' : 'text-gray-400'
      }`}
    >
      {remaining.toLocaleString()}
    </span>
  );
}

export function PostComposer({ orgSlug, workspaceSlug, editPost }: PostComposerProps) {
  const router = useRouter();
  const { data: accounts = [] } = useConnectedAccounts(orgSlug);
  const [accountId, setAccountId] = useState(editPost?.connectedAccountId ?? '');
  const [caption, setCaption] = useState(editPost?.caption ?? '');
  const [mediaUrls, setMediaUrls] = useState<string[]>(editPost?.media.map((m) => m.url) ?? []);
  const [scheduledAt, setScheduledAt] = useState(
    editPost?.scheduledAt ? format(new Date(editPost.scheduledAt), "yyyy-MM-dd'T'HH:mm") : '',
  );
  const [dragOver, setDragOver] = useState(false);
  const [suggestedHashtags, setSuggestedHashtags] = useState<string[]>([]);

  const selectedAccount = accounts.find((a) => a.id === accountId);
  const platform = selectedAccount?.platform ?? '';
  const limits = PLATFORM_LIMITS[platform];
  const validationErrors = accountId ? validatePost(platform, caption, mediaUrls) : [];

  const createPost = useCreatePost(orgSlug, workspaceSlug);
  const updatePost = useUpdatePost(orgSlug, workspaceSlug, editPost?.id ?? '');
  const uploadMedia = useUploadMedia(orgSlug);
  const generateHashtags = useGenerateHashtags(orgSlug);
  const optimizeCaption = useOptimizeForPlatform(orgSlug);

  const isPending = createPost.isPending || updatePost.isPending || uploadMedia.isPending;

  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      const result = await uploadMedia.mutateAsync({ file });
      setMediaUrls((prev) => [...prev, result.publicUrl]);
    }
  };

  const handleHashtags = async () => {
    if (!caption.trim() || !platform) return;
    const tags = await generateHashtags.mutateAsync({ caption, platform });
    setSuggestedHashtags(tags);
  };

  const applyHashtag = (tag: string) => {
    setCaption((prev) => `${prev}${prev.endsWith(' ') || prev === '' ? '' : ' '}${tag}`);
  };

  const handleOptimize = async () => {
    if (!caption.trim() || !platform) return;
    const optimized = await optimizeCaption.mutateAsync({ caption, platform });
    setCaption(optimized);
    setSuggestedHashtags([]);
  };

  const handleSubmit = async (action: 'draft' | 'schedule', e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId) return;

    const dto = {
      connectedAccountId: accountId,
      caption: caption || undefined,
      scheduledAt: action === 'schedule' && scheduledAt ? scheduledAt : undefined,
      mediaUrls: mediaUrls.length ? mediaUrls : undefined,
    };

    if (editPost) {
      await updatePost.mutateAsync(dto);
    } else {
      await createPost.mutateAsync(dto);
    }

    router.push(`/${orgSlug}/${workspaceSlug}/publish`);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">Account</label>
        <select
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Select a connected account…</option>
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.id}>
              {acc.displayName} ({acc.platform})
            </option>
          ))}
        </select>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">Caption</label>
          <div className="flex items-center gap-3">
            {platform && (
              <>
                <button
                  type="button"
                  onClick={() => void handleHashtags()}
                  disabled={!caption.trim() || generateHashtags.isPending}
                  className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 disabled:opacity-40"
                  title="Generate hashtags"
                >
                  {generateHashtags.isPending ? (
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
                  ) : (
                    <span className="font-medium">#</span>
                  )}
                  Hashtags
                </button>
                <button
                  type="button"
                  onClick={() => void handleOptimize()}
                  disabled={!caption.trim() || optimizeCaption.isPending}
                  className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 disabled:opacity-40"
                  title={`Optimize for ${limits?.label ?? platform}`}
                >
                  {optimizeCaption.isPending ? (
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
                  ) : (
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  )}
                  Optimize
                </button>
              </>
            )}
            {limits && <CharCounter text={caption} limit={limits.charLimit} />}
          </div>
        </div>
        <textarea
          value={caption}
          onChange={(e) => {
            setCaption(e.target.value);
            setSuggestedHashtags([]);
          }}
          rows={6}
          placeholder={
            limits
              ? `Write your ${limits.label} caption…`
              : 'Select an account to write your caption…'
          }
          className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        {suggestedHashtags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {suggestedHashtags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => applyHashtag(tag)}
                className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-xs text-indigo-700 hover:bg-indigo-100"
              >
                {tag}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setSuggestedHashtags([])}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Media
          {limits && (
            <span className="ml-1.5 font-normal text-gray-400">
              ({mediaUrls.length}/{limits.maxMedia}
              {limits.requiresMedia ? ', required' : ''})
            </span>
          )}
        </label>

        {mediaUrls.length > 0 && (
          <div className="mb-3 grid grid-cols-4 gap-2">
            {mediaUrls.map((url, i) => (
              <div key={i} className="group relative aspect-square">
                <img src={url} alt="" className="h-full w-full rounded-lg object-cover" />
                <button
                  type="button"
                  onClick={() => setMediaUrls((prev) => prev.filter((_, j) => j !== i))}
                  className="absolute right-1 top-1 hidden rounded-full bg-gray-900/70 p-0.5 text-white group-hover:flex"
                >
                  <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            void handleFileUpload(e.dataTransfer.files);
          }}
          className={`flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed py-8 transition-colors ${
            dragOver ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input
            type="file"
            className="sr-only"
            accept="image/*,video/*"
            multiple
            onChange={(e) => void handleFileUpload(e.target.files)}
          />
          {uploadMedia.isPending ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          ) : (
            <>
              <svg
                className="mb-2 h-6 w-6 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-sm text-gray-500">
                Drop files here or <span className="text-indigo-600">browse</span>
              </p>
              <p className="mt-1 text-xs text-gray-400">Images and videos supported</p>
            </>
          )}
        </label>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Schedule for (optional)
        </label>
        <input
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {scheduledAt && (
          <button
            type="button"
            onClick={() => setScheduledAt('')}
            className="ml-2 text-xs text-gray-400 hover:text-gray-600"
          >
            Clear
          </button>
        )}
      </div>

      {validationErrors.length > 0 && (
        <ul className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {validationErrors.map((err) => (
            <li key={err}>• {err}</li>
          ))}
        </ul>
      )}

      {(createPost.isError || updatePost.isError) && (
        <p className="text-sm text-red-600">Failed to save. Please try again.</p>
      )}

      <div className="flex gap-3 border-t border-gray-200 pt-4">
        <button
          type="button"
          onClick={(e) => void handleSubmit('draft', e)}
          disabled={isPending || !accountId || validationErrors.length > 0}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isPending ? 'Saving…' : 'Save as draft'}
        </button>
        {scheduledAt && (
          <button
            type="button"
            onClick={(e) => void handleSubmit('schedule', e)}
            disabled={isPending || !accountId || validationErrors.length > 0}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isPending
              ? 'Scheduling…'
              : `Schedule for ${format(new Date(scheduledAt), 'MMM d, h:mm a')}`}
          </button>
        )}
      </div>
    </div>
  );
}
