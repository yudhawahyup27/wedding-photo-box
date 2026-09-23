'use client';

import { useEffect, useState } from 'react';

interface FrameRow {
  id: string;
  name: string;
  slug: string;
  category: string;
  orientation: string;
  photo_count: number;
  is_active: boolean;
  sort_order: number;
}

export default function AdminFramesPage() {
  const [frames, setFrames] = useState<FrameRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/admin/frames');
    const data = await res.json();
    setFrames(data.frames ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleActive(id: string) {
    await fetch('/api/admin/frames', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle-active', id }),
    });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-ink">Frames</h1>
        <p className="text-xs text-ink-soft">{frames.length} frame · aktifkan/nonaktifkan di sini</p>
      </div>
      <p className="mt-1 max-w-2xl text-sm text-ink-soft">
        Menambah/mengedit desain frame baru saat ini dilakukan melalui kode (src/lib/frames/presets.ts) lalu
        menjalankan <code className="rounded bg-cream px-1">npx tsx scripts/generate-frame-seed.ts</code> untuk
        memperbarui database. Editor visual drag-and-drop belum tersedia di versi ini (lihat catatan
        keterbatasan pada laporan akhir).
      </p>

      {loading ? (
        <p className="mt-6 text-sm text-ink-soft">Memuat...</p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {frames
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((f) => (
              <div key={f.id} className="card-elevated p-4">
                <p className="font-display text-lg text-ink">{f.name}</p>
                <p className="text-xs capitalize text-ink-soft">
                  {f.category} · {f.orientation} · {f.photo_count} foto
                </p>
                <button
                  onClick={() => toggleActive(f.id)}
                  className={`mt-3 w-full rounded-full px-3 py-1.5 text-xs font-medium ${
                    f.is_active ? 'bg-ink text-ivory' : 'bg-cream text-ink-soft'
                  }`}
                >
                  {f.is_active ? 'Aktif' : 'Nonaktif'}
                </button>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
