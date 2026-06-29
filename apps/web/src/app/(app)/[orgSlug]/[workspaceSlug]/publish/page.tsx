'use client';

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  endOfWeek,
  subMonths,
} from 'date-fns';
import Link from 'next/link';
import { use, useState } from 'react';

import {
  useDeletePost,
  usePublishNow,
  usePosts,
  type Post,
  type PostStatus,
} from '@/lib/hooks/use-posts';

const STATUS_COLORS: Record<PostStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  SCHEDULED: 'bg-blue-100 text-blue-700',
  PUBLISHING: 'bg-yellow-100 text-yellow-700',
  PUBLISHED: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
};

function PostCard({
  post,
  orgSlug,
  workspaceSlug,
}: {
  post: Post;
  orgSlug: string;
  workspaceSlug: string;
}) {
  const deletePost = useDeletePost(orgSlug, workspaceSlug);
  const publishNow = usePublishNow(orgSlug, workspaceSlug);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[post.status]}`}
            >
              {post.status}
            </span>
            <span className="text-xs text-gray-400">{post.connectedAccount.platform}</span>
          </div>
          <p className="line-clamp-3 text-sm text-gray-700">
            {post.caption ?? <span className="italic text-gray-400">No caption</span>}
          </p>
          {post.scheduledAt && (
            <p className="mt-1.5 text-xs text-gray-500">
              Scheduled: {format(new Date(post.scheduledAt), 'MMM d, yyyy h:mm a')}
            </p>
          )}
          {post.publishedAt && (
            <p className="mt-1.5 text-xs text-green-600">
              Published: {format(new Date(post.publishedAt), 'MMM d, yyyy h:mm a')}
            </p>
          )}
          {post.errorMessage && (
            <p className="mt-1.5 text-xs text-red-500">Error: {post.errorMessage}</p>
          )}
        </div>
        {post.media[0] && (
          <img
            src={post.media[0].url}
            alt=""
            className="h-16 w-16 flex-shrink-0 rounded-lg object-cover"
          />
        )}
      </div>

      <div className="mt-3 flex items-center gap-2 border-t border-gray-100 pt-3">
        {post.status !== 'PUBLISHED' && post.status !== 'PUBLISHING' && (
          <Link
            href={`/${orgSlug}/${workspaceSlug}/publish/${post.id}/edit`}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
          >
            Edit
          </Link>
        )}
        {(post.status === 'DRAFT' || post.status === 'FAILED') && (
          <button
            onClick={() => publishNow.mutate(post.id)}
            disabled={publishNow.isPending}
            className="text-xs font-medium text-green-600 hover:text-green-800 disabled:opacity-50"
          >
            Publish now
          </button>
        )}
        {post.platformUrl && (
          <a
            href={post.platformUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-gray-500 hover:text-gray-700"
          >
            View on platform
          </a>
        )}
        <button
          onClick={() => {
            if (confirm('Delete this post?')) deletePost.mutate(post.id);
          }}
          className="ml-auto text-xs text-red-500 hover:text-red-700"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function CalendarView({
  posts,
  orgSlug,
  workspaceSlug,
}: {
  posts: Post[];
  orgSlug: string;
  workspaceSlug: string;
}) {
  const [month, setMonth] = useState(new Date());
  const start = startOfWeek(startOfMonth(month));
  const end = endOfWeek(endOfMonth(month));
  const days = eachDayOfInterval({ start, end });

  const postsByDay = new Map<string, Post[]>();
  for (const post of posts) {
    if (!post.scheduledAt && !post.publishedAt) continue;
    const date = post.scheduledAt ?? post.publishedAt;
    const key = format(new Date(date!), 'yyyy-MM-dd');
    postsByDay.set(key, [...(postsByDay.get(key) ?? []), post]);
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => setMonth((m) => subMonths(m, 1))}
          className="rounded-lg p-1.5 hover:bg-gray-100"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <h2 className="text-sm font-semibold text-gray-900">{format(month, 'MMMM yyyy')}</h2>
        <button
          onClick={() => setMonth((m) => addMonths(m, 1))}
          className="rounded-lg p-1.5 hover:bg-gray-100"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div
            key={d}
            className="py-1 text-center text-[10px] font-semibold uppercase tracking-wider text-gray-400"
          >
            {d}
          </div>
        ))}
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const dayPosts = postsByDay.get(key) ?? [];
          const inMonth = isSameMonth(day, month);
          return (
            <div
              key={key}
              className={`min-h-[80px] border border-gray-100 p-1 ${!inMonth ? 'bg-gray-50' : ''}`}
            >
              <div
                className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                  isToday(day)
                    ? 'bg-indigo-600 text-white'
                    : inMonth
                      ? 'text-gray-700'
                      : 'text-gray-300'
                }`}
              >
                {format(day, 'd')}
              </div>
              <div className="space-y-0.5">
                {dayPosts.slice(0, 3).map((post) => (
                  <Link
                    key={post.id}
                    href={`/${orgSlug}/${workspaceSlug}/publish/${post.id}/edit`}
                    className={`block truncate rounded px-1 py-0.5 text-[10px] leading-tight ${STATUS_COLORS[post.status]}`}
                  >
                    {post.connectedAccount.platform}
                  </Link>
                ))}
                {dayPosts.length > 3 && (
                  <p className="text-[10px] text-gray-400">+{dayPosts.length - 3} more</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function PublishPage({
  params,
}: {
  params: Promise<{ orgSlug: string; workspaceSlug: string }>;
}) {
  const { orgSlug, workspaceSlug } = use(params);
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data: posts = [], isLoading } = usePosts(orgSlug, workspaceSlug, {
    status: statusFilter as Post['status'] | undefined,
  });

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-gray-900">Publishing Studio</h1>
          <div className="flex rounded-lg border border-gray-200 bg-white">
            <button
              onClick={() => setView('list')}
              className={`px-3 py-1.5 text-xs font-medium ${view === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-500'} rounded-l-lg`}
            >
              List
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`px-3 py-1.5 text-xs font-medium ${view === 'calendar' ? 'bg-gray-100 text-gray-900' : 'text-gray-500'} rounded-r-lg border-l border-gray-200`}
            >
              Calendar
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {view === 'list' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="PUBLISHED">Published</option>
              <option value="FAILED">Failed</option>
            </select>
          )}
          <Link
            href={`/${orgSlug}/${workspaceSlug}/publish/new`}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            New post
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : view === 'calendar' ? (
        <CalendarView posts={posts} orgSlug={orgSlug} workspaceSlug={workspaceSlug} />
      ) : posts.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-sm text-gray-400">No posts yet.</p>
          <Link
            href={`/${orgSlug}/${workspaceSlug}/publish/new`}
            className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-800"
          >
            Create your first post
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} orgSlug={orgSlug} workspaceSlug={workspaceSlug} />
          ))}
        </div>
      )}
    </div>
  );
}
