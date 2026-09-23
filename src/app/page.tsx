'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Camera, Images, Radio, Sparkles, Settings, Copy, Check, Calendar, Newspaper, BookOpen, Film, Heart } from 'lucide-react';
import { useBoothStore } from '@/lib/booth/store';
import { useWeddingConfig } from '@/lib/wedding/useWeddingConfig';
import PetalField from '@/components/PetalField';

export default function WelcomePage() {
  const { config } = useWeddingConfig();
  const reset = useBoothStore((s) => s.reset);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Starting fresh from the welcome screen always clears any previous
    // guest's session state (name, shots, QR).
    reset();
  }, [reset]);

  const formattedDate = (() => {
    try {
      const d = new Date(config.weddingDate);
      if (isNaN(d.getTime())) return config.weddingDate;
      return new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(d);
    } catch {
      return config.weddingDate;
    }
  })();

  const handleCopyHashtag = () => {
    if (!config.hashtag) return;
    navigator.clipboard?.writeText(config.hashtag);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="welcome-home select-none">
      {/* Gentle drifting petals in background */}
      <PetalField />

      <div className="welcome-content fade-up">
        {/* Top Bar */}
        <header className="welcome-topbar">
          <div className="flex items-center gap-2 text-bronze font-semibold text-xs tracking-widest uppercase">
            <span className="inline-block w-2 h-2 rounded-full bg-gold animate-pulse" />
            <span>Official Photo Booth Kiosk</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-ink-soft">
              <Calendar className="w-3.5 h-3.5 text-bronze" />
              <span>{formattedDate}</span>
            </div>

            <Link
              href="/admin"
              className="welcome-admin-btn p-2 rounded-full hover:bg-black/5 transition text-ink-soft"
              title="Admin & Settings"
              aria-label="Admin Settings"
            >
              <Settings className="w-4 h-4" />
            </Link>
          </div>
        </header>

        {/* Hero Card */}
        <div className="welcome-hero-card">
          {/* Royal Crest / Monogram Badge */}
          <div className="welcome-crest">
            <span>{config.monogram}</span>
          </div>

          <p className="text-xs uppercase tracking-[0.25em] font-semibold text-bronze">
            The Wedding Celebration of
          </p>

          <h1 className="welcome-couple-title">
            {config.coupleNames}
          </h1>

          <p className="welcome-tagline">
            {config.welcomeSubtitle || 'Abadikan senyum, tawa, dan momen berharga Anda di hari bahagia kami.'}
          </p>

          {/* Interactive Feature Showcase Cards */}
          <div className="welcome-showcase-grid">
            {/* Card 1: Newspaper Broadsheet */}
            <div className="welcome-showcase-card group">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-amber-900/10 text-bronze">
                  <Newspaper className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-bronze/15 text-bronze uppercase tracking-wider">
                  The Daily Moment
                </span>
              </div>
              <h3 className="font-display text-lg font-bold text-ink mt-1">Newspaper Edition</h3>
              <p className="text-xs text-ink-soft/80 leading-relaxed">
                Halaman depan koran broadsheet klasik dengan artikel &amp; headline berita pernikahan.
              </p>
            </div>

            {/* Card 2: Magazine Vogue */}
            <div className="welcome-showcase-card group">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-rose-900/10 text-rose-800">
                  <BookOpen className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-800/15 text-rose-800 uppercase tracking-wider">
                  Vogue &amp; Lookbook
                </span>
              </div>
              <h3 className="font-display text-lg font-bold text-ink mt-1">Magazine Cover</h3>
              <p className="text-xs text-ink-soft/80 leading-relaxed">
                Sampul majalah mode editorial dengan cover lines, barcode, dan tata letak 1–4 foto.
              </p>
            </div>

            {/* Card 3: Photo Strip & Polaroid */}
            <div className="welcome-showcase-card group">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-emerald-900/10 text-sage">
                  <Film className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sage/15 text-sage uppercase tracking-wider">
                  Classic &amp; Strip
                </span>
              </div>
              <h3 className="font-display text-lg font-bold text-ink mt-1">Strip &amp; Signature</h3>
              <p className="text-xs text-ink-soft/80 leading-relaxed">
                Strip foto vertikal, polaroid nostalgia, dan ornamen monogram emas elegan.
              </p>
            </div>
          </div>

          {/* Grand Touch-to-Start CTA Button */}
          <Link href="/guest" className="welcome-primary-cta">
            <Camera className="w-6 h-6 text-gold animate-bounce" />
            <span>Sentuh Untuk Mulai</span>
            <Sparkles className="w-5 h-5 text-gold opacity-90" />
          </Link>

          {/* Secondary Action Links */}
          <div className="welcome-secondary-actions">
            {config.allowGallery && (
              <Link href="/gallery" className="welcome-sub-action">
                <Images className="w-4 h-4 text-bronze" />
                <span>Buka Galeri Foto</span>
              </Link>
            )}

            {config.allowLiveGallery && (
              <Link href="/live-gallery" className="welcome-sub-action">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
                <Radio className="w-4 h-4 text-rose-600" />
                <span>Live Stream Gallery</span>
              </Link>
            )}
          </div>
        </div>

        {/* 3 Steps How-It-Works Strip */}
        <div className="welcome-steps-strip">
          <div className="welcome-step-item">
            <span className="welcome-step-num">1</span>
            <span>Pilih Template Favorit</span>
          </div>
          <span className="text-bronze/40 hidden sm:inline">→</span>
          <div className="welcome-step-item">
            <span className="welcome-step-num">2</span>
            <span>Bergaya di Depan Kamera</span>
          </div>
          <span className="text-bronze/40 hidden sm:inline">→</span>
          <div className="welcome-step-item">
            <span className="welcome-step-num">3</span>
            <span>Scan QR &amp; Unduh Hasilnya</span>
          </div>
        </div>

        {/* Footer Bar */}
        <footer className="flex flex-col sm:flex-row items-center justify-between gap-3 px-3 text-xs text-ink-soft">
          <div className="flex items-center gap-2">
            <Heart className="w-3.5 h-3.5 text-rose fill-rose" />
            <span>Terima kasih telah hadir &amp; merayakan bersama kami</span>
          </div>

          <button
            onClick={handleCopyHashtag}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-bronze/10 text-bronze hover:bg-bronze hover:text-white transition font-semibold"
            title="Salin hashtag"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-sage" />
                <span>Hashtag Tersalin!</span>
              </>
            ) : (
              <>
                <span>{config.hashtag}</span>
                <Copy className="w-3 h-3 opacity-60" />
              </>
            )}
          </button>
        </footer>
      </div>
    </main>
  );
}

