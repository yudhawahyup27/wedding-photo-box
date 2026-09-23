'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Monogram from '@/components/Monogram';
import { searchRsvpGuests, type RsvpGuestResult } from '@/lib/guest/search';
import { useBoothStore } from '@/lib/booth/store';
import { useWeddingConfig } from '@/lib/wedding/useWeddingConfig';

type Tab = 'search' | 'manual';

export default function GuestIdentificationPage() {
  const router = useRouter();
  const { config, eventGuestName } = useWeddingConfig();
  const setGuest = useBoothStore((s) => s.setGuest);

  const [tab, setTab] = useState<Tab>('search');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<RsvpGuestResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [manualName, setManualName] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!config.allowRsvpSearch) setTab('manual');
  }, [config.allowRsvpSearch]);

  useEffect(() => {
    if (eventGuestName) {
      setTab('manual');
      setManualName(eventGuestName);
    }
  }, [eventGuestName]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      const r = await searchRsvpGuests(query);
      setResults(r);
      setSearching(false);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function proceed(guest: { id: string | null; name: string | null }) {
    setGuest(guest);
    router.push('/mode');
  }

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col px-6 py-10">
      <Monogram text={config.monogram} className="self-center text-lg" />
      <h1 className="mt-6 text-center font-display text-3xl text-ink">Siapa namamu?</h1>
      <p className="mt-2 text-center text-sm text-ink-soft">
        Cari namamu dari daftar tamu, ketik manual, atau lanjut tanpa nama.
      </p>

      {config.allowRsvpSearch && (
        <div className="mt-8 flex gap-2 rounded-full bg-cream p-1">
          <button
            onClick={() => setTab('search')}
            className={`flex-1 rounded-full py-2.5 text-sm font-medium transition ${tab === 'search' ? 'bg-white text-ink shadow-sm' : 'text-ink-soft'}`}
          >
            Cari Nama
          </button>
          <button
            onClick={() => setTab('manual')}
            className={`flex-1 rounded-full py-2.5 text-sm font-medium transition ${tab === 'manual' ? 'bg-white text-ink shadow-sm' : 'text-ink-soft'}`}
          >
            Ketik Manual
          </button>
        </div>
      )}

      <div className="mt-6 flex-1">
        {tab === 'search' && config.allowRsvpSearch ? (
          <div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ketik nama kamu..."
              className="w-full rounded-2xl border border-[var(--line)] bg-white px-5 py-4 text-base text-ink placeholder:text-ink-soft/60 focus:border-bronze focus:outline-none"
              aria-label="Cari nama tamu"
            />
            <div className="mt-4 space-y-2">
              {searching && <p className="text-center text-sm text-ink-soft">Mencari...</p>}
              {!searching &&
                results.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => proceed({ id: g.id, name: g.name })}
                    className="card-elevated flex w-full items-center justify-between px-5 py-4 text-left text-base text-ink transition hover:-translate-y-0.5"
                  >
                    <span>{g.name}</span>
                    <span className="text-ink-soft">→</span>
                  </button>
                ))}
              {!searching && query.trim().length >= 2 && results.length === 0 && (
                <p className="mt-4 text-center text-sm text-ink-soft">
                  Nama tidak ditemukan. Coba ketik manual di tab sebelah.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div>
            <input
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              placeholder="Nama kamu"
              className="w-full rounded-2xl border border-[var(--line)] bg-white px-5 py-4 text-base text-ink placeholder:text-ink-soft/60 focus:border-bronze focus:outline-none"
              aria-label="Nama manual"
            />
            <button
              onClick={() => proceed({ id: null, name: manualName.trim() || null })}
              disabled={!manualName.trim()}
              className="btn-primary mt-4 w-full"
            >
              Lanjut
            </button>
          </div>
        )}
      </div>

      <button
        onClick={() => proceed({ id: null, name: null })}
        className="btn-secondary mt-6 w-full text-sm"
      >
        Lanjut Tanpa Nama
      </button>
    </main>
  );
}
