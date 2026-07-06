'use client';

import { use, useState } from 'react';

import { useCreateLabel, useDeleteLabel, useLabels } from '@/lib/hooks/use-labels';

const PRESET_COLORS = [
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#14b8a6',
  '#3b82f6',
  '#64748b',
];

export default function LabelsPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params);
  const { data: labels = [], isLoading } = useLabels(orgSlug);
  const createLabel = useCreateLabel(orgSlug);
  const deleteLabel = useDeleteLabel(orgSlug);

  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]!);
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    await createLabel.mutateAsync({ name: name.trim(), color });
    setName('');
    setColor(PRESET_COLORS[0]!);
    setCreating(false);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Labels</h2>
          <p className="mt-1 text-sm text-gray-500">Organize conversations with colored labels.</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          New label
        </button>
      </div>

      {creating && (
        <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <h3 className="mb-3 text-sm font-medium text-gray-900">Create label</h3>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-gray-600">Name</label>
              <input
                autoFocus
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void handleCreate();
                }}
                placeholder="e.g. Urgent, VIP, Billing"
                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Color</label>
              <div className="flex gap-1.5">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`h-6 w-6 rounded-full transition-transform ${color === c ? 'scale-125 ring-2 ring-white ring-offset-1' : 'hover:scale-110'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button
              onClick={() => {
                setCreating(false);
                setName('');
              }}
              className="rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={() => void handleCreate()}
              disabled={!name.trim() || createLabel.isPending}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {createLabel.isPending ? 'Creating…' : 'Create'}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : labels.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 py-12 text-center">
          <p className="text-sm text-gray-400">No labels yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200">
          {labels.map((label, i) => (
            <div
              key={label.id}
              className={`flex items-center gap-3 px-4 py-3 ${i < labels.length - 1 ? 'border-b border-gray-100' : ''}`}
            >
              <span
                className="h-3 w-3 flex-shrink-0 rounded-full"
                style={{ backgroundColor: label.color }}
              />
              <span className="flex-1 text-sm font-medium text-gray-900">{label.name}</span>
              <span
                className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
                style={{ backgroundColor: label.color }}
              >
                {label.name}
              </span>
              <button
                onClick={() => deleteLabel.mutate(label.id)}
                disabled={deleteLabel.isPending}
                className="ml-2 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                title="Delete label"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
