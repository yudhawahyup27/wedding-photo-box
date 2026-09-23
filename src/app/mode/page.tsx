'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Monogram from '@/components/Monogram';
import { useBoothStore } from '@/lib/booth/store';
import { useWeddingConfig } from '@/lib/wedding/useWeddingConfig';
import type { CaptureType, PhotoMode } from '@/lib/frames/types';
import { UPCOMING_MODES } from '@/lib/wedding/config';
import { getModeInfo, PHOTO_MODES, normalizePhotoMode } from '@/lib/frames/modes';
import {
  Camera,
  Newspaper,
  BookOpen,
  Film,
  Sparkles,
  Video,
  ArrowRight,
  ChevronLeft,
  Crown,
  Layers,
  Heart,
  type LucideIcon,
} from 'lucide-react';

export default function ModeSelectPage() {
  return (
    <Suspense fallback={null}>
      <ModeSelectPageInner />
    </Suspense>
  );
}

const MODE_METADATA: Record<
  PhotoMode,
  {
    icon: LucideIcon;
    badge?: string;
    badgeColor?: string;
    tagline: string;
    highlights: string[];
    gradient: string;
  }
> = {
  newspaper: {
    icon: Newspaper,
    badge: 'Trending',
    badgeColor: 'bg-amber-900/10 text-amber-900 border-amber-900/20',
    tagline: 'The Daily Moment',
    highlights: ['1–4 Foto', 'Vintage Broadsheet', 'Koran Editorial'],
    gradient: 'from-[#f5eedc] to-[#e8dcc4]',
  },
  magazine: {
    icon: Sparkles,
    badge: 'Popular',
    badgeColor: 'bg-stone-900 text-amber-200 border-amber-500/30',
    tagline: 'Vogue & Luxury Editorial',
    highlights: ['1–4 Foto', 'Cover Lines', 'High Fashion'],
    gradient: 'from-[#2a2421] to-[#191614]',
  },
  classic: {
    icon: Heart,
    badge: 'Classic',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    tagline: 'Romantic Wedding Standard',
    highlights: ['1–3 Foto', 'Gold Monogram', 'Minimalist'],
    gradient: 'from-[#faf5ec] to-[#ede3cf]',
  },
  strip: {
    icon: Film,
    badge: 'Photo Strip',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
    tagline: 'Retro Photobooth Strip',
    highlights: ['3–4 Pose', 'Vertical Strip', 'Cetak 2x6"'],
    gradient: 'from-[#fcf4f2] to-[#eddcd8]',
  },
  photobook: {
    icon: BookOpen,
    badge: 'Album',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    tagline: 'Wedding Keepsake Album',
    highlights: ['Multi Frame', 'Cerita Bersama', 'Elegan'],
    gradient: 'from-[#f2f7f4] to-[#dce8e0]',
  },
  photo: {
    icon: Camera,
    badge: 'Studio',
    badgeColor: 'bg-stone-100 text-stone-800 border-stone-200',
    tagline: 'Single Shot Portrait',
    highlights: ['1 Foto Tajam', 'Instant Print', 'Quick Shot'],
    gradient: 'from-[#f7f5f0] to-[#e8e4da]',
  },
  video: {
    icon: Video,
    badge: 'Live',
    badgeColor: 'bg-red-100 text-red-700 border-red-200',
    tagline: 'Video Greeting Message',
    highlights: ['10 Detik Video', 'Audio Jernih', 'Guestbook Live'],
    gradient: 'from-[#fdf2f2] to-[#fae0e0]',
  },
  gif: {
    icon: Layers,
    badge: 'Segera Hadir',
    badgeColor: 'bg-stone-200 text-stone-500 border-stone-300',
    tagline: 'Animated Loop Sequence',
    highlights: ['Burst Motion', 'Fun GIF Loop'],
    gradient: 'from-[#f5f5f5] to-[#eaeaea]',
  },
  boomerang: {
    icon: Film,
    badge: 'Segera Hadir',
    badgeColor: 'bg-stone-200 text-stone-500 border-stone-300',
    tagline: 'Back & Forth Motion',
    highlights: ['Fun Bounce', 'Instant Loop'],
    gradient: 'from-[#f5f5f5] to-[#eaeaea]',
  },
};

function ModeSelectPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { config } = useWeddingConfig();
  const setMode = useBoothStore((s) => s.setMode);
  const setCaptureType = useBoothStore((s) => s.setCaptureType);
  const enabledModes = config.enabledModes.map(normalizePhotoMode);

  useEffect(() => {
    const queryMode = searchParams.get('mode');
    if (queryMode !== null) {
      setMode(normalizePhotoMode(queryMode));
    }
  }, [searchParams, setMode]);

  function chooseMode(mode: PhotoMode) {
    setMode(mode);
    chooseCapture(mode === 'video' ? 'video' : 'photo');
  }

  function chooseCapture(type: CaptureType) {
    setCaptureType(type);
    router.push('/frame');
  }

  return (
    <main className="relative min-h-[100dvh] w-full bg-gradient-to-b from-[#fbf7ee] via-[#f5ede0] to-[#eee2cb] px-4 py-8 sm:px-6 sm:py-12">
      {/* Decorative backdrop elements */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-96 w-[600px] rounded-full bg-gradient-to-b from-amber-200/30 to-transparent blur-3xl" />

      <div className="relative mx-auto flex max-w-4xl flex-col items-center">
        {/* Top Navigation */}
        <div className="flex w-full items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-ink backdrop-blur-md transition hover:bg-white hover:shadow-sm"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Beranda</span>
          </button>

          <Monogram text={config.monogram} className="text-sm font-semibold tracking-wider text-bronze" />

          <div className="w-16" />
        </div>

        {/* Header Title */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-800/15 bg-amber-50/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-amber-900 shadow-xs backdrop-blur-xs">
            <Crown className="h-3.5 w-3.5 text-amber-700" />
            <span>Pilihan Format Foto</span>
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl md:text-5xl">
            Pilih Mode Kenangan
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft sm:text-base">
            Pilih estetika dan gaya visual terbaik untuk mengabadikan momen istimewa Anda hari ini.
          </p>
        </div>

        {/* Mode Grid Cards */}
        <div className="mt-8 grid w-full grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {PHOTO_MODES.map((mode) => {
            const info = getModeInfo(mode);
            const meta = MODE_METADATA[mode] || {
              icon: Camera,
              badge: undefined,
              tagline: info.description,
              highlights: ['Photo Mode'],
              gradient: 'from-white to-stone-50',
            };
            const Icon = meta.icon;
            const enabled = enabledModes.includes(mode);
            const upcoming = UPCOMING_MODES.includes(mode) || !enabled;
            const isDarkCard = mode === 'magazine';

            return (
              <button
                key={mode}
                disabled={upcoming}
                onClick={() => chooseMode(mode)}
                className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border text-left p-5 transition-all duration-300 ${
                  upcoming
                    ? 'cursor-not-allowed border-stone-200/60 bg-white/40 opacity-60 backdrop-blur-xs'
                    : isDarkCard
                    ? 'border-amber-500/30 bg-gradient-to-br from-[#241f1c] to-[#151311] text-amber-100 shadow-lg hover:-translate-y-1 hover:border-amber-400/60 hover:shadow-2xl hover:shadow-amber-950/30'
                    : 'border-amber-900/15 bg-white/90 text-ink shadow-sm backdrop-blur-md hover:-translate-y-1 hover:border-amber-800/40 hover:bg-white hover:shadow-xl hover:shadow-amber-900/10'
                }`}
              >
                {/* Top Badge & Icon */}
                <div>
                  <div className="flex items-center justify-between">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl border transition-transform duration-300 group-hover:scale-110 ${
                        isDarkCard
                          ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                          : 'border-amber-900/10 bg-amber-50 text-amber-900'
                      }`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>

                    {meta.badge && (
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          upcoming
                            ? 'border-stone-300 bg-stone-100 text-stone-500'
                            : meta.badgeColor || 'border-amber-200 bg-amber-100 text-amber-900'
                        }`}
                      >
                        {meta.badge}
                      </span>
                    )}
                  </div>

                  {/* Mode Name & Description */}
                  <div className="mt-4">
                    <h3
                      className={`font-display text-xl font-bold tracking-tight ${
                        isDarkCard ? 'text-amber-100' : 'text-ink'
                      }`}
                    >
                      {info.label}
                    </h3>
                    <p
                      className={`mt-1 text-xs font-medium ${
                        isDarkCard ? 'text-amber-200/70' : 'text-amber-900/70'
                      }`}
                    >
                      {meta.tagline}
                    </p>
                    <p
                      className={`mt-1.5 text-xs line-clamp-2 leading-relaxed ${
                        isDarkCard ? 'text-stone-300' : 'text-ink-soft'
                      }`}
                    >
                      {info.description}
                    </p>
                  </div>
                </div>

                {/* Highlights & Action Footer */}
                <div className="mt-5 pt-3 border-t border-black/5 dark:border-white/10 flex items-center justify-between">
                  <div className="flex flex-wrap gap-1.5">
                    {meta.highlights.slice(0, 2).map((h, i) => (
                      <span
                        key={i}
                        className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
                          isDarkCard
                            ? 'bg-white/10 text-amber-200/90'
                            : 'bg-amber-900/5 text-ink-soft'
                        }`}
                      >
                        {h}
                      </span>
                    ))}
                  </div>

                  {!upcoming ? (
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full transition-all duration-300 group-hover:translate-x-1 ${
                        isDarkCard
                          ? 'bg-amber-500/20 text-amber-300 group-hover:bg-amber-400 group-hover:text-black'
                          : 'bg-amber-100 text-amber-900 group-hover:bg-amber-900 group-hover:text-white'
                      }`}
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  ) : (
                    <span className="text-[10px] font-medium italic text-stone-400">Soon</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </main>
  );
}
