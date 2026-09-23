'use client';

import { useEffect, useState } from 'react';

interface Overview {
  totalSessions: number;
  modeCounts: Record<string, number>;
  uniqueGuests: number;
  photosToday: number;
  downloads: number;
  shares: number;
  prints: number;
  mostPopularFrame: string | null;
  latest: { id: string; guest_name: string | null; mode: string; created_at: string }[];
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card-elevated p-5">
      <p className="text-xs uppercase tracking-wide text-ink-soft">{label}</p>
      <p className="mt-1 font-display text-3xl text-ink">{value}</p>
    </div>
  );
}

export default function AdminOverviewPage() {
  const [data, setData] = useState<Overview | null>(null);

  useEffect(() => {
    fetch('/api/admin/overview')
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) return <p className="text-sm text-ink-soft">Memuat data...</p>;

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">Overview</h1>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Sesi" value={data.totalSessions} />
        <StatCard label="Foto" value={data.modeCounts.photo ?? 0} />
        <StatCard label="Photo Strip" value={data.modeCounts.strip ?? 0} />
        <StatCard label="Tamu Unik" value={data.uniqueGuests} />
        <StatCard label="Foto Hari Ini" value={data.photosToday} />
        <StatCard label="Downloads" value={data.downloads} />
        <StatCard label="Shares" value={data.shares} />
        <StatCard label="Prints" value={data.prints} />
      </div>

      <div className="mt-6 card-elevated p-5">
        <p className="text-xs uppercase tracking-wide text-ink-soft">Frame Terpopuler</p>
        <p className="mt-1 font-display text-xl text-ink">{data.mostPopularFrame ?? '—'}</p>
      </div>

      <div className="mt-6">
        <h2 className="font-display text-xl text-ink">Kenangan Terbaru</h2>
        <div className="mt-3 space-y-2">
          {data.latest.map((s) => (
            <div key={s.id} className="card-elevated flex items-center justify-between px-4 py-3 text-sm">
              <span>{s.guest_name ?? 'Anonim'}</span>
              <span className="capitalize text-ink-soft">{s.mode}</span>
              <span className="text-ink-soft">{new Date(s.created_at).toLocaleString('id-ID')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
