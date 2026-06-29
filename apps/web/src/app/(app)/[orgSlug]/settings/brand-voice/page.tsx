'use client';

import { use, useState } from 'react';

import {
  useBrandVoices,
  useCreateBrandVoice,
  useDeleteBrandVoice,
  type BrandVoice,
} from '@/lib/hooks/use-ai';

function BrandVoiceCard({ voice, orgSlug }: { voice: BrandVoice; orgSlug: string }) {
  const del = useDeleteBrandVoice(orgSlug);
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-gray-900">{voice.name}</h3>
            {voice.isDefault && (
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                Default
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-gray-500">Tone: {voice.tone}</p>
          {voice.instructions && <p className="mt-1 text-xs text-gray-400">{voice.instructions}</p>}
          {voice.examples.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {voice.examples.map((ex, i) => (
                <span
                  key={i}
                  className="rounded border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-600"
                >
                  {ex.length > 40 ? `${ex.slice(0, 40)}…` : ex}
                </span>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={() => {
            if (confirm(`Delete "${voice.name}"?`)) del.mutate(voice.id);
          }}
          disabled={del.isPending}
          className="text-xs text-red-500 hover:text-red-700 disabled:opacity-40"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export default function BrandVoicePage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params);
  const { data: voices = [], isLoading } = useBrandVoices(orgSlug);
  const create = useCreateBrandVoice(orgSlug);

  const [name, setName] = useState('');
  const [tone, setTone] = useState('');
  const [instructions, setInstructions] = useState('');
  const [examplesText, setExamplesText] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const examples = examplesText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    await create.mutateAsync({
      name,
      tone,
      examples,
      instructions: instructions || undefined,
      isDefault,
    });
    setName('');
    setTone('');
    setInstructions('');
    setExamplesText('');
    setIsDefault(false);
    setShowForm(false);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Brand Voice</h2>
          <p className="mt-1 text-sm text-gray-500">
            Define how your AI assistant sounds when writing replies and content.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          {showForm ? 'Cancel' : 'Add voice'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={(e) => void handleCreate(e)}
          className="mb-6 space-y-4 rounded-xl border border-gray-200 bg-white p-6"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Friendly Support"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Tone</label>
              <input
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                required
                placeholder="e.g. warm, professional, concise"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Instructions (optional)
            </label>
            <input
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Always greet the customer by name. Avoid jargon."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Example phrases (one per line)
            </label>
            <textarea
              value={examplesText}
              onChange={(e) => setExamplesText(e.target.value)}
              rows={3}
              placeholder={"Thanks so much for reaching out!\nWe're happy to help with that."}
              className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="rounded border-gray-300"
              />
              Set as default
            </label>
            <button
              type="submit"
              disabled={create.isPending || !name || !tone}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
            >
              {create.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : voices.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 py-16 text-center">
          <p className="text-sm text-gray-400">No brand voices yet.</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
          >
            Create your first voice
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {voices.map((v) => (
            <BrandVoiceCard key={v.id} voice={v} orgSlug={orgSlug} />
          ))}
        </div>
      )}
    </div>
  );
}
