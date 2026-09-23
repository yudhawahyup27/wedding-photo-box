'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Monogram from '@/components/Monogram';
import { useBoothStore } from '@/lib/booth/store';
import { useWeddingConfig } from '@/lib/wedding/useWeddingConfig';
import { buildPublicPhotoUrl, generateQrDataUrl } from '@/lib/qr/generate';
import { submitGuestbookEntry } from '@/lib/guestbook/submit';
import { retryQueuedUpload } from '@/lib/session/save';
import { getPendingUpload } from '@/lib/media/offlineQueue';

export default function CompletePage() {
  return (
    <Suspense fallback={null}>
      <CompletePageInner />
    </Suspense>
  );
}

function CompletePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pending = searchParams.get('pending') === '1';
  const { config } = useWeddingConfig();

  const guest = useBoothStore((s) => s.guest);
  const finalDataUrl = useBoothStore((s) => s.finalDataUrl);
  const finalType = useBoothStore((s) => s.finalType);
  const sessionId = useBoothStore((s) => s.sessionId);
  const qrToken = useBoothStore((s) => s.qrToken);
  const reset = useBoothStore((s) => s.reset);

  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(pending);
  const [retrying, setRetrying] = useState(false);
  const [guestbookOpen, setGuestbookOpen] = useState(false);
  const [guestbookName, setGuestbookName] = useState(guest?.name ?? '');
  const [guestbookMessage, setGuestbookMessage] = useState('');
  const [guestbookSent, setGuestbookSent] = useState(false);
  const [guestbookSending, setGuestbookSending] = useState(false);

  useEffect(() => {
    if (!sessionId || !qrToken) {
      router.replace('/');
      return;
    }
    generateQrDataUrl(buildPublicPhotoUrl(qrToken)).then(setQrDataUrl);
  }, [sessionId, qrToken, router]);

  async function handleRetryUpload() {
    if (!sessionId) return;
    setRetrying(true);
    const job = await getPendingUpload(sessionId);
    if (job) {
      const result = await retryQueuedUpload(job);
      setIsPending(!result.ok);
    }
    setRetrying(false);
  }

  function downloadPhoto() {
    if (!finalDataUrl) return;
    const a = document.createElement('a');
    a.href = finalDataUrl;
    const ext = finalType === 'video' ? (finalDataUrl.includes('video/mp4') ? 'mp4' : 'webm') : 'jpg';
    a.download = `Yudha-Ima-Wedding-${(sessionId ?? '').slice(0, 8)}.${ext}`;
    a.click();
  }

  async function sharePhoto() {
    const url = qrToken ? buildPublicPhotoUrl(qrToken) : '';
    const shareText = `Kenangan dari pernikahan ${config.coupleNames} ${config.hashtag}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: config.coupleNames, text: shareText, url });
        return;
      }
    } catch {
      /* user cancelled or share failed — fall through to clipboard */
    }
    try {
      await navigator.clipboard.writeText(url);
      alert('Tautan foto disalin ke clipboard.');
    } catch {
      /* ignore */
    }
  }

  function printPhoto() {
    window.print();
  }

  async function submitGuestbook() {
    if (!guestbookName.trim() || !guestbookMessage.trim()) return;
    setGuestbookSending(true);
    try {
      await submitGuestbookEntry({ name: guestbookName.trim(), message: guestbookMessage.trim() });
      setGuestbookSent(true);
    } catch {
      alert('Gagal mengirim ucapan. Coba lagi sebentar lagi.');
    } finally {
      setGuestbookSending(false);
    }
  }

  function finish() {
    reset();
    router.push('/');
  }

  if (!sessionId) return null;

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col px-6 py-10">
      <div className="print:hidden">
        <Monogram text={config.monogram} className="self-center text-lg" />
        <h1 className="mt-6 text-center font-display text-3xl text-ink">{config.completionTitle}</h1>
        <p className="mt-2 text-center text-sm text-ink-soft">{config.completionMessage}</p>

        {isPending && (
          <div className="mt-4 rounded-2xl bg-blush/50 px-4 py-3 text-center text-sm text-ink">
            Foto kamu masih aman di perangkat ini. Upload belum berhasil karena koneksi.
            <button onClick={handleRetryUpload} disabled={retrying} className="mt-2 block w-full btn-secondary text-xs">
              {retrying ? 'Mencoba...' : 'Coba Upload Lagi'}
            </button>
          </div>
        )}

        {finalDataUrl && finalType === 'image' && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={finalDataUrl} alt="Hasil foto" className="mt-6 w-full rounded-2xl border border-[var(--line)] shadow-lg" />
        )}
        {finalDataUrl && finalType === 'video' && (
          <video src={finalDataUrl} controls playsInline loop className="mt-6 w-full rounded-2xl border border-[var(--line)] shadow-lg" />
        )}

        {qrDataUrl && !isPending && (
          <div className="mt-6 flex flex-col items-center">
            <p className="text-sm font-medium text-ink-soft">Scan untuk menyimpan fotomu</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="QR code foto" className="mt-2 h-40 w-40" />
          </div>
        )}

        <p className="mt-4 text-center text-sm font-medium text-bronze">{config.hashtag}</p>

        <div className="mt-6 grid grid-cols-2 gap-2">
          <button onClick={downloadPhoto} className="btn-secondary text-sm">
            Download
          </button>
          {config.allowSharing && (
            <button onClick={sharePhoto} className="btn-secondary text-sm">
              Bagikan
            </button>
          )}
          {config.allowPrint && (
            <button onClick={printPhoto} className="btn-secondary text-sm">
              Print
            </button>
          )}
          {config.allowGallery && (
            <button onClick={() => router.push('/gallery')} className="btn-secondary text-sm">
              Lihat Album
            </button>
          )}
        </div>

        {config.allowDigitalGuestbook && (
          <div className="mt-6">
            {!guestbookOpen ? (
              <button onClick={() => setGuestbookOpen(true)} className="btn-secondary w-full text-sm">
                Tulis Ucapan
              </button>
            ) : guestbookSent ? (
              <p className="rounded-2xl bg-cream px-4 py-3 text-center text-sm text-ink-soft">
                Terima kasih atas ucapannya 💛
              </p>
            ) : (
              <div className="card-elevated space-y-2 p-4">
                <input
                  value={guestbookName}
                  onChange={(e) => setGuestbookName(e.target.value)}
                  placeholder="Nama kamu"
                  className="w-full rounded-xl border border-[var(--line)] px-3 py-2.5 text-sm focus:border-bronze focus:outline-none"
                />
                <textarea
                  value={guestbookMessage}
                  onChange={(e) => setGuestbookMessage(e.target.value)}
                  placeholder="Tulis ucapan untuk Yudha & Ima..."
                  rows={3}
                  className="w-full rounded-xl border border-[var(--line)] px-3 py-2.5 text-sm focus:border-bronze focus:outline-none"
                />
                <button onClick={submitGuestbook} disabled={guestbookSending} className="btn-primary w-full text-sm">
                  {guestbookSending ? 'Mengirim...' : 'Kirim Ucapan'}
                </button>
              </div>
            )}
          </div>
        )}

        {config.allowAudioGuestbook === false && (
          <button disabled className="btn-secondary mt-2 w-full text-sm opacity-50">
            Rekam Pesan Suara (Segera Hadir)
          </button>
        )}

        <div className="mt-8 flex gap-2">
          <button onClick={() => router.push('/mode')} className="btn-secondary flex-1 text-sm">
            Foto Lagi
          </button>
          <button onClick={finish} className="btn-primary flex-1 text-sm">
            Selesai
          </button>
        </div>
      </div>

      {/* Dedicated print output — no navigation/buttons, per spec section 35 */}
      {finalDataUrl && finalType === 'image' && (
        <div id="print-area" className="hidden print:block">
          {Array.from({ length: config.printCopies }).map((_, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={finalDataUrl} alt="" className="page-break-after mb-4 w-full" />
          ))}
        </div>
      )}
    </main>
  );
}
