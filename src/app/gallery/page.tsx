'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Monogram from '@/components/Monogram';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { getPublicMediaUrl } from '@/lib/media/upload';
import { useWeddingConfig } from '@/lib/wedding/useWeddingConfig';

interface GalleryItem {
  id: string;
  qr_token: string;
  mode: string;
  created_at: string;
  thumbUrl: string;
}

type Filter = 'all' | 'today' | 'newest';

export default function GalleryPage() {
  const { config } = useWeddingConfig();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [lightbox, setLightbox] = useState<GalleryItem | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = getSupabaseBrowserClient();
      const { data: sessions } = await supabase
        .from('photo_sessions')
        .select('id,qr_token,mode,created_at')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(120);

      if (!sessions || sessions.length === 0) {
        setLoading(false);
        return;
      }

      const ids = sessions.map((s) => s.id);
      const { data: assets } = await supabase
        .from('photo_session_assets')
        .select('session_id,asset_type,storage_path')
        .in('session_id', ids)
        .eq('asset_type', 'thumbnail');

      const thumbBySession = new Map((assets ?? []).map((a) => [a.session_id, a.storage_path]));

      const mapped = sessions
        .filter((s) => thumbBySession.has(s.id))
        .map((s) => ({
          id: s.id,
          qr_token: s.qr_token,
          mode: s.mode,
          created_at: s.created_at,
          thumbUrl: getPublicMediaUrl(thumbBySession.get(s.id) as string),
        }));
      setItems(mapped);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'today') {
      const today = new Date().toDateString();
      return items.filter((i) => new Date(i.created_at).toDateString() === today);
    }
    return items;
  }, [items, filter]);

  return (
    <main className="mx-auto min-h-[100dvh] max-w-5xl px-6 py-10">
      <div className="flex flex-col items-center text-center">
        <Monogram text={config.monogram} className="text-lg" />
        <h1 className="mt-4 font-display text-3xl text-ink">Album Bersama</h1>
        <p className="mt-2 text-sm text-ink-soft">Kenangan dari photo booth {config.coupleNames}.</p>
        <p className="mt-1 text-sm font-medium text-bronze">{config.hashtag}</p>
        <Link href="/guest" className="btn-primary mt-5">
          Mulai Photo Booth
        </Link>
      </div>

      <div className="mt-8 flex justify-center gap-2">
        {(['all', 'today'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              filter === f ? 'bg-ink text-ivory' : 'bg-cream text-ink-soft'
            }`}
          >
            {f === 'all' ? 'Semua' : 'Hari Ini'}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="mt-10 text-center text-sm text-ink-soft">Memuat album...</p>
      ) : filtered.length === 0 ? (
        <p className="mt-10 text-center text-sm text-ink-soft">Belum ada foto. Jadilah yang pertama!</p>
      ) : (
        <div className="mt-8 columns-2 gap-3 sm:columns-3 md:columns-4">
          {filtered.map((item) => (
            <button
              key={item.id}
              onClick={() => setLightbox(item)}
              className="mb-3 block w-full overflow-hidden rounded-xl"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.thumbUrl} alt="" loading="lazy" className="w-full object-cover transition hover:scale-[1.02]" />
            </button>
          ))}
        </div>
      )}

      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4" onClick={() => setLightbox(null)}>
          <div className="max-h-[85vh] max-w-md" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lightbox.thumbUrl} alt="" className="max-h-[70vh] w-full rounded-2xl object-contain" />
            <Link href={`/photo/${lightbox.qr_token}`} className="btn-primary mt-3 block w-full text-center text-sm">
              Buka Foto
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
