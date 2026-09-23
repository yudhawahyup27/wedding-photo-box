'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Monogram from '@/components/Monogram';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { getPublicMediaUrl } from '@/lib/media/upload';
import { useWeddingConfig } from '@/lib/wedding/useWeddingConfig';
import { buildAlbumUrl } from '@/lib/qr/generate';

interface SessionData {
  id: string;
  guest_name: string | null;
  mode: string;
  created_at: string;
}

interface AssetRow {
  asset_type: string;
  storage_path: string;
  mime_type: string | null;
}

export default function PublicPhotoPage() {
  const params = useParams<{ token: string }>();
  const { config } = useWeddingConfig();
  const [state, setState] = useState<'loading' | 'ok' | 'not-found' | 'error'>('loading');
  const [session, setSession] = useState<SessionData | null>(null);
  const [finalUrl, setFinalUrl] = useState<string | null>(null);
  const [finalMimeType, setFinalMimeType] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: sessionRow, error: sessionError } = await supabase
          .from('photo_sessions')
          .select('id,guest_name,mode,created_at')
          .eq('qr_token', params.token)
          .eq('is_public', true)
          .maybeSingle();

        if (sessionError || !sessionRow) {
          setState('not-found');
          return;
        }
        setSession(sessionRow as SessionData);

        const { data: assets } = await supabase
          .from('photo_session_assets')
          .select('asset_type,storage_path,mime_type')
          .eq('session_id', sessionRow.id);

        const final = (assets as AssetRow[] | null)?.find((a) => a.asset_type === 'final' || a.asset_type === 'gif' || a.asset_type === 'video' || a.asset_type === 'boomerang');
        if (!final) {
          setState('error');
          return;
        }
        setFinalUrl(getPublicMediaUrl(final.storage_path));
        setFinalMimeType(final.mime_type);

        // best-effort view/download counter is bumped only on actual download tap
        setState('ok');
      } catch {
        setState('error');
      }
    })();
  }, [params.token]);

  async function handleDownload() {
    if (!finalUrl) return;
    const a = document.createElement('a');
    a.href = finalUrl;
    const ext = finalMimeType?.includes('video') ? (finalMimeType.includes('mp4') ? 'mp4' : 'webm') : 'jpg';
    a.download = `Yudha-Ima-Wedding-${(session?.id ?? '').slice(0, 8)}.${ext}`;
    a.target = '_blank';
    a.click();
    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.rpc('increment_session_counter', { p_qr_token: params.token, p_counter: 'download_count' });
    } catch {
      /* non-critical */
    }
  }

  async function handleShare() {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      if (navigator.share) {
        await navigator.share({ title: config.coupleNames, text: `${config.hashtag}`, url });
      } else {
        await navigator.clipboard.writeText(url);
        alert('Tautan disalin.');
      }
      const supabase = getSupabaseBrowserClient();
      await supabase.rpc('increment_session_counter', { p_qr_token: params.token, p_counter: 'share_count' });
    } catch {
      /* ignore */
    }
  }

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col items-center px-6 py-10 text-center">
      <Monogram text={config.monogram} className="text-lg" />
      <h1 className="mt-4 font-display text-3xl text-ink">{config.coupleNames}</h1>

      {state === 'loading' && <p className="mt-10 text-sm text-ink-soft">Memuat foto...</p>}

      {state === 'not-found' && (
        <div className="mt-10">
          <p className="font-display text-xl text-ink">Foto tidak ditemukan</p>
          <p className="mt-2 text-sm text-ink-soft">QR ini mungkin tidak valid atau foto sudah dihapus.</p>
        </div>
      )}

      {state === 'error' && (
        <div className="mt-10">
          <p className="font-display text-xl text-ink">Terjadi kesalahan</p>
          <p className="mt-2 text-sm text-ink-soft">Coba muat ulang halaman ini.</p>
        </div>
      )}

      {state === 'ok' && finalUrl && (
        <>
          {finalMimeType?.startsWith('video/') ? (
            <video src={finalUrl} controls playsInline loop className="mt-6 w-full rounded-2xl border border-[var(--line)] shadow-lg" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={finalUrl} alt="Kenangan photo booth" className="mt-6 w-full rounded-2xl border border-[var(--line)] shadow-lg" />
          )}
          <p className="mt-6 max-w-xs text-sm text-ink-soft">
            Terima kasih sudah menjadi bagian dari hari bahagia kami.
          </p>
          <p className="mt-2 text-sm font-medium text-bronze">{config.hashtag}</p>

          <div className="mt-6 grid w-full grid-cols-2 gap-2">
            <button onClick={handleDownload} className="btn-secondary text-sm">
              Download
            </button>
            <button onClick={handleShare} className="btn-secondary text-sm">
              Bagikan
            </button>
          </div>
          {config.allowGallery && (
            <a href={buildAlbumUrl()} className="btn-primary mt-3 w-full text-sm">
              Lihat Album Bersama
            </a>
          )}
        </>
      )}
    </main>
  );
}
