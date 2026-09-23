'use client';

import { useEffect, useRef, useState } from 'react';
import Monogram from '@/components/Monogram';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { getPublicMediaUrl } from '@/lib/media/upload';
import { useWeddingConfig } from '@/lib/wedding/useWeddingConfig';

interface LiveItem {
  id: string;
  imgUrl: string;
}

const MAX_ITEMS = 24;

export default function LiveGalleryPage() {
  const { config } = useWeddingConfig();
  const [items, setItems] = useState<LiveItem[]>([]);
  const [slideIndex, setSlideIndex] = useState(0);
  const [hideChrome, setHideChrome] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    async function loadInitial() {
      const { data: sessions } = await supabase
        .from('photo_sessions')
        .select('id,created_at')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(MAX_ITEMS);
      if (!sessions) return;
      const ids = sessions.map((s) => s.id);
      const { data: assets } = await supabase
        .from('photo_session_assets')
        .select('session_id,storage_path')
        .in('session_id', ids)
        .eq('asset_type', 'final');
      const map = new Map((assets ?? []).map((a) => [a.session_id, a.storage_path]));
      setItems(
        sessions
          .filter((s) => map.has(s.id))
          .map((s) => ({ id: s.id, imgUrl: getPublicMediaUrl(map.get(s.id) as string) }))
      );
    }
    loadInitial();

    const channel = supabase
      .channel('live-gallery')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'photo_session_assets' }, async (payload) => {
        const row = payload.new as { session_id: string; asset_type: string; storage_path: string };
        if (row.asset_type !== 'final') return;
        setItems((prev) => [{ id: row.session_id, imgUrl: getPublicMediaUrl(row.storage_path) }, ...prev].slice(0, MAX_ITEMS));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (items.length === 0) return;
    const interval = setInterval(() => {
      setSlideIndex((i) => (i + 1) % items.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [items.length]);

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }

  const current = items[slideIndex];

  return (
    <div ref={containerRef} className="relative min-h-[100dvh] bg-charcoal text-charcoal-text">
      {!hideChrome && (
        <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between px-8 py-6">
          <Monogram text={config.monogram} className="text-charcoal-text" />
          <div className="flex gap-2">
            <button onClick={() => setHideChrome(true)} className="btn-secondary border-white/20 text-charcoal-text text-xs">
              Sembunyikan Kontrol
            </button>
            <button onClick={toggleFullscreen} className="btn-secondary border-white/20 text-charcoal-text text-xs">
              Fullscreen
            </button>
          </div>
        </div>
      )}

      <div className="flex min-h-[100dvh] items-center justify-center p-10">
        {current ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={current.id}
            src={current.imgUrl}
            alt=""
            className="max-h-[85vh] max-w-[85vw] rounded-2xl object-contain shadow-2xl fade-up"
          />
        ) : (
          <p className="font-display text-2xl text-charcoal-text/70">Menunggu kenangan pertama...</p>
        )}
      </div>

      {hideChrome && (
        <button
          onClick={() => setHideChrome(false)}
          className="absolute bottom-4 right-4 z-10 rounded-full bg-white/10 px-3 py-1.5 text-xs text-charcoal-text/70"
        >
          Tampilkan Kontrol
        </button>
      )}

      <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm font-medium text-gold">{config.hashtag}</p>
    </div>
  );
}
