'use client';

import { useEffect, useState } from 'react';

interface SessionRow {
  id: string;
  guest_name: string | null;
  mode: string;
  frame_slug: string | null;
  qr_token: string;
  is_public: boolean;
  download_count: number;
  share_count: number;
  print_count: number;
  created_at: string;
}

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    const res = await fetch(`/api/admin/sessions?${params.toString()}`);
    const data = await res.json();
    setSessions(data.sessions ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function toggleVisibility(id: string) {
    await fetch('/api/admin/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle-visibility', id }),
    });
    load();
  }

  async function remove(id: string) {
    if (!confirm('Hapus sesi ini? Tindakan ini tidak bisa dibatalkan.')) return;
    await fetch('/api/admin/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id }),
    });
    load();
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">Sessions</h1>
      <div className="mt-4 flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load()}
          placeholder="Cari nama tamu..."
          className="w-64 rounded-xl border border-[var(--line)] px-3 py-2 text-sm focus:border-bronze focus:outline-none"
        />
        <button onClick={load} className="btn-secondary text-sm">
          Cari
        </button>
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-ink-soft">Memuat...</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-ink-soft">
              <tr>
                <th className="pb-2">Tamu</th>
                <th className="pb-2">Mode</th>
                <th className="pb-2">Frame</th>
                <th className="pb-2">Tanggal</th>
                <th className="pb-2">DL / Share / Print</th>
                <th className="pb-2">Publik</th>
                <th className="pb-2">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id} className="border-t border-[var(--line)]">
                  <td className="py-2">{s.guest_name ?? 'Anonim'}</td>
                  <td className="py-2 capitalize">{s.mode}</td>
                  <td className="py-2">{s.frame_slug ?? '—'}</td>
                  <td className="py-2 text-ink-soft">{new Date(s.created_at).toLocaleString('id-ID')}</td>
                  <td className="py-2 text-ink-soft">
                    {s.download_count} / {s.share_count} / {s.print_count}
                  </td>
                  <td className="py-2">{s.is_public ? 'Ya' : 'Tidak'}</td>
                  <td className="py-2">
                    <div className="flex gap-2">
                      <a
                        href={`/photo/${s.qr_token}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-bronze underline"
                      >
                        Lihat
                      </a>
                      <button onClick={() => toggleVisibility(s.id)} className="text-xs text-ink-soft underline">
                        {s.is_public ? 'Sembunyikan' : 'Tampilkan'}
                      </button>
                      <button onClick={() => remove(s.id)} className="text-xs text-rose underline">
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {sessions.length === 0 && <p className="mt-6 text-sm text-ink-soft">Tidak ada sesi.</p>}
        </div>
      )}
    </div>
  );
}
