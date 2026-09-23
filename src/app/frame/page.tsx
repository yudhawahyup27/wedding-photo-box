'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Monogram from '@/components/Monogram';
import { useBoothStore } from '@/lib/booth/store';
import { useWeddingConfig } from '@/lib/wedding/useWeddingConfig';
import { getFrameCatalog } from '@/lib/frames/repository';
import { FRAME_CATEGORIES } from '@/lib/frames/presets';
import type { FrameConfig } from '@/lib/frames/types';

function FrameSwatch({ f }: { f: FrameConfig }) {
  const isNewspaper = f.category === 'newspaper' || f.slug.includes('newspaper');
  const isMagazine = f.category === 'magazine' || f.slug.includes('magazine');
  const cols = f.orientation === 'strip' ? 1 : f.photoCount >= 4 ? 2 : f.photoCount === 2 ? 2 : 1;
  const rows = f.orientation === 'strip' ? f.photoCount : f.photoCount >= 4 ? 2 : 1;

  return (
    <div
      className={`relative flex aspect-[4/5] w-full flex-col items-center justify-center overflow-hidden p-2.5 transition group-hover:shadow-md ${
        isNewspaper
          ? 'border border-[#211e1b]/30 bg-[#f6f1e6]'
          : isMagazine
          ? 'border border-amber-900/20 bg-[#1a1816]'
          : 'rounded-xl border border-[var(--line)] bg-[var(--ivory)]'
      }`}
    >
      {/* Mini Masthead for Newspaper */}
      {isNewspaper && (
        <div className="w-full border-b border-[#211e1b]/40 pb-1 text-center font-serif text-[8px] font-bold tracking-[0.15em] text-[#211e1b]">
          THE DAILY GAZETTE
        </div>
      )}

      {/* Mini Masthead for Magazine */}
      {isMagazine && (
        <div className="w-full border-b border-amber-200/30 pb-0.5 text-center font-serif text-[8px] font-bold tracking-[0.2em] text-amber-200">
          VOGUE
        </div>
      )}

      {/* Grid Slots */}
      <div
        className={`grid h-full w-full gap-1.5 ${isNewspaper || isMagazine ? 'pt-1.5' : ''}`}
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
        }}
      >
        {Array.from({ length: f.photoCount }).map((_, i) => (
          <div
            key={i}
            className="relative flex items-center justify-center overflow-hidden rounded-[2px]"
            style={{
              background: isMagazine ? 'rgba(255,255,255,0.18)' : isNewspaper ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.7)',
              border: `1px solid ${isMagazine ? 'rgba(255,255,255,0.2)' : `${f.accentColor}40`}`,
            }}
          >
            <span className="text-[9px] opacity-40 font-mono">#{i + 1}</span>
          </div>
        ))}
      </div>

      {/* Photo Count Badge */}
      <div className="absolute bottom-1.5 right-1.5 rounded-full bg-ink/80 px-2 py-0.5 text-[9px] font-bold text-white shadow-sm backdrop-blur-sm">
        {f.photoCount} {f.photoCount === 1 ? 'Foto' : 'Foto'}
      </div>
    </div>
  );
}

export default function FrameSelectPage() {
  const router = useRouter();
  const { config } = useWeddingConfig();
  const existingPhotoCount = useBoothStore((s) => s.shots.length);
  const setFrame = useBoothStore((s) => s.setFrame);
  const setContinueCapture = useBoothStore((s) => s.setContinueCapture);

  const selectedMode = useBoothStore((s) => s.mode);
  const [catalog, setCatalog] = useState<FrameConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>(() => {
    if (selectedMode === 'newspaper' || selectedMode === 'magazine' || selectedMode === 'strip') {
      return selectedMode;
    }
    return 'all';
  });
  const [preview, setPreview] = useState<FrameConfig | null>(null);

  useEffect(() => {
    getFrameCatalog().then((frames) => {
      setCatalog(frames);
      setLoading(false);
    });
  }, []);

  const compatible = useMemo(() => {
    return catalog.filter((f) => f.photoCount >= 1);
  }, [catalog]);

  const filtered = useMemo(
    () => (category === 'all' ? compatible : compatible.filter((f) => f.category === category)),
    [compatible, category]
  );

  function chooseFrame(f: FrameConfig) {
    const needsMorePhotos = existingPhotoCount > 0 && existingPhotoCount < f.photoCount;
    sessionStorage.setItem('snapbooth-frame-slug', f.slug);
    setFrame(f);
    setContinueCapture(needsMorePhotos);
    // When editing an existing result, keep the captured media and only
    // re-render it with the newly selected frame.
    router.push(existingPhotoCount >= f.photoCount ? '/preview' : '/booth');
  }

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-2xl flex-col px-6 py-10">
      <Monogram text={config.monogram} className="self-center text-lg" />
      <h1 className="mt-6 text-center font-display text-3xl text-ink">Pilih Template</h1>
      <p className="mt-2 text-center text-sm text-ink-soft">Template membungkus media Photo atau Video.</p>

      <div className="mt-6 flex gap-2 overflow-x-auto scrollbar-none pb-1">
        {FRAME_CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
              category === c.id ? 'bg-ink text-ivory' : 'bg-cream text-ink-soft'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="mt-10 text-center text-sm text-ink-soft">Memuat frame...</p>
      ) : (
        <div className="mt-6 grid flex-1 grid-cols-2 gap-4 pb-6 sm:grid-cols-3">
          {filtered.map((f) => (
            <button key={f.id} onClick={() => setPreview(f)} className="card-elevated overflow-hidden p-3 text-left">
              <FrameSwatch f={f} />
              <p className="mt-2 font-display text-base text-ink">{f.name}</p>
              <p className="text-xs text-ink-soft">
                {f.slug.startsWith('newspaper-photo-') ? 'NEWSPAPER PHOTO' : f.category} · {f.photoCount} foto
              </p>
            </button>
          ))}
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center" onClick={() => setPreview(null)}>
          <div
            className="card-elevated w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto max-w-[220px]">
              <FrameSwatch f={preview} />
            </div>
            <h2 className="mt-4 text-center font-display text-2xl text-ink">{preview.name}</h2>
            <p className="mt-1 text-center text-sm text-ink-soft">{preview.description}</p>
            <p className="mt-1 text-center text-xs text-ink-soft">
              {preview.slug.startsWith('newspaper-photo-') ? 'Satu desain · jumlah foto otomatis' : `${preview.orientation} · ${preview.photoCount} foto`}
            </p>
            <button onClick={() => chooseFrame(preview)} className="btn-primary mt-5 w-full">
              {existingPhotoCount >= preview.photoCount ? 'Ganti Frame' : 'Gunakan Frame Ini'}
              </button>
            <button onClick={() => setPreview(null)} className="btn-secondary mt-2 w-full text-sm">
              Kembali
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
