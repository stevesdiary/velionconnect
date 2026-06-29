'use client';

import { useState } from 'react';

import { useCreateWorkspace, useDeleteWorkspace, useWorkspaces } from '@/lib/hooks/use-workspaces';

export default function WorkspacesSettingsPage({ params }: { params: { orgSlug: string } }) {
  const { orgSlug } = params;
  const { data: workspaces, isLoading } = useWorkspaces(orgSlug);
  const createWorkspace = useCreateWorkspace(orgSlug);
  const deleteWorkspace = useDeleteWorkspace(orgSlug);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await createWorkspace.mutateAsync({ name, description: description || undefined });
      setName('');
      setDescription('');
      setShowForm(false);
    } catch {
      setError('Failed to create workspace. Please try again.');
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Workspaces</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          New workspace
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 space-y-3 rounded-lg bg-gray-50 p-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              maxLength={100}
              autoFocus
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Description <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createWorkspace.isPending}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {createWorkspace.isPending ? 'Creating…' : 'Create'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {workspaces?.map((ws) => (
            <li key={ws.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{ws.name}</p>
                {ws.description && <p className="text-xs text-gray-500">{ws.description}</p>}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">{ws.slug}</span>
                {ws.slug !== 'default' && (
                  <button
                    onClick={() => deleteWorkspace.mutate(ws.slug)}
                    disabled={deleteWorkspace.isPending}
                    className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
                  >
                    Delete
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
