'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Monogram from '@/components/Monogram';
import { useBoothStore } from '@/lib/booth/store';
import { useWeddingConfig } from '@/lib/wedding/useWeddingConfig';
import { loadImage, renderFrame, canvasToBlob, makeThumbnail } from '@/lib/frames/render';
import { getFrameBySlug } from '@/lib/frames/repository';
import { saveSessionWithOfflineFallback } from '@/lib/session/save';
import { PHOTO_FILTERS, getFilterById } from '@/lib/filters/presets';
import type { FrameConfig } from '@/lib/frames/types';
import type { WeddingConfig } from '@/lib/wedding/config';

export default function PreviewPage() {
  const router = useRouter();
  const { config } = useWeddingConfig();
  const guest = useBoothStore((s) => s.guest);
  const mode = useBoothStore((s) => s.mode);
  const frame = useBoothStore((s) => s.frame);
  const setFrame = useBoothStore((s) => s.setFrame);
  const shots = useBoothStore((s) => s.shots);
  const mediaItems = useBoothStore((s) => s.mediaItems);
  const finalDataUrl = useBoothStore((s) => s.finalDataUrl);
  const finalType = useBoothStore((s) => s.finalType);
  const setFinal = useBoothStore((s) => s.setFinal);
  const setSaved = useBoothStore((s) => s.setSaved);
  const setRetakeIndex = useBoothStore((s) => s.setRetakeIndex);
  const filterId = useBoothStore((s) => s.filterId);
  const setFilterId = useBoothStore((s) => s.setFilterId);

  const [loadedMedia, setLoadedMedia] = useState<(HTMLImageElement | HTMLVideoElement)[] | null>(null);

  const [rendering, setRendering] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [saved, setSavedOk] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [downloadError, setDownloadError] = useState(false);
  const [editingText, setEditingText] = useState(false);
  const [templateText, setTemplateText] = useState({
    headline: 'THE MOMENT EVERYONE NOTICED',
    subheadline: 'A standout moment from today\'s event.',
    name: 'THE DAILY REPORT',
    date: new Date(config.weddingDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
    quote: 'Every day has a story worth remembering.',
    article: 'A quick frame from the middle of the action, selected as one of the standout moments from the event.',
    venue: '',
    issueNumber: '01',
    eventType: 'General',
    eventName: '',
    host: config.coupleNames,
    location: '',
    tagline: 'A moment worth keeping.',
    caption: 'Captured during today\'s session.',
    edition: 'City Edition',
  });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const thumbBlobRef = useRef<Blob | null>(null);
  const sessionRef = useRef<{ sessionId: string; qrToken: string } | null>(null);

  useEffect(() => {
    if (!frame?.slug.startsWith('newspaper-photo-')) return;
    setTemplateText((current) => ({
      ...current,
      headline: current.headline === 'THE MOMENT EVERYONE NOTICED' ? 'LOCAL RESIDENT SPOTTED IN UNUSUALLY GOOD MOOD' : current.headline,
      subheadline: current.subheadline === 'A standout moment from today\'s event.' ? 'Witnesses say the moment quickly became the talk of the city.' : current.subheadline,
      name: current.name === 'THE DAILY REPORT' ? 'THE DAILY REPORT' : current.name,
      quote: current.quote === 'Every day has a story worth remembering.' ? 'Every day has a story worth remembering.' : current.quote,
    }));
  }, [frame?.slug, config.coupleNames]);

  useEffect(() => {
    if (!frame) {
      let cancelled = false;
      const savedSlug = sessionStorage.getItem('snapbooth-frame-slug');
      getFrameBySlug(savedSlug || config.defaultFrameSlug).then((savedFrame) => {
        if (cancelled) return;
        if (savedFrame) setFrame(savedFrame);
        else router.replace('/frame');
      });
      return () => {
        cancelled = true;
      };
    }
    if (shots.length < frame.photoCount) {
      router.replace('/booth');
      return;
    }
    let cancelled = false;
    (async () => {
      const media = await Promise.all((mediaItems.length ? mediaItems : shots.map((s) => ({ type: 'image' as const, path: s }))).map(loadMediaElement));
      if (!cancelled) setLoadedMedia(media);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.defaultFrameSlug, frame, router, setFrame, shots.length]);

  useEffect(() => {
    if (!frame || !loadedMedia) return;
    let cancelled = false;
    (async () => {
      setRendering(true);
      const filterCss = getFilterById(filterId).css;
      const hasVideo = mediaItems.some((item) => item.type === 'video');
      const canvas = await renderFrame({ frame, photos: loadedMedia, wedding: config, scale: 2, mirror: false, filterCss, templateText });
      if (cancelled) return;
      canvasRef.current = canvas;
      thumbBlobRef.current = await makeThumbnail(canvas);
      if (hasVideo) {
        const videoDataUrl = await renderCompositeVideo({ frame, media: loadedMedia, wedding: config, filterCss, templateText });
        if (cancelled) return;
        setFinal(videoDataUrl, 'video');
      } else {
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        setFinal(dataUrl, 'image');
      }
      setRendering(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frame, loadedMedia, filterId, templateText]);

  async function handleSave() {
    if (!frame || !canvasRef.current || !finalDataUrl) return;
    setSaving(true);
    setSaveError(false);

    const ids = sessionRef.current ?? { sessionId: crypto.randomUUID(), qrToken: crypto.randomUUID() };
    sessionRef.current = ids;
    const finalBlob = finalType === 'video' && finalDataUrl ? dataUrlToBlob(finalDataUrl) : await canvasToBlob(canvasRef.current);
    const thumbBlob = thumbBlobRef.current ?? finalBlob;
    if (!finalBlob) {
      setSaving(false);
      setSaveError(true);
      return;
    }
    const finalDataUrlForUpload = await blobToDataUrl(finalBlob);
    const thumbDataUrlForUpload = await blobToDataUrl(thumbBlob!);

    const result = await saveSessionWithOfflineFallback(
      ids.sessionId,
      ids.qrToken,
      { guestId: guest?.id ?? null, guestName: guest?.name ?? null, mode, frame },
      finalDataUrlForUpload,
      thumbDataUrlForUpload,
      mediaItems.length ? mediaItems : shots.map((s) => ({ type: 'image' as const, path: s }))
    );

    setSaving(false);
    if (result.ok) {
      setSaved(ids.sessionId, ids.qrToken);
      setSavedOk(true);
    } else {
      setSaveError(true);
    }
  }

  async function handleDownload() {
    if (!finalDataUrl) return;
    setDownloading(true);
    setDownloadError(false);
    try {
      const blob = dataUrlToBlob(finalDataUrl);
      const ext = finalType === 'video' ? (blob.type.includes('mp4') ? 'mp4' : 'webm') : 'jpg';
      await downloadBlob(blob, `Yudha-Ima-Wedding-${Date.now()}.${ext}`);
      setDownloaded(true);
    } catch {
      setDownloadError(true);
    } finally {
      setDownloading(false);
    }
  }

  if (!frame) return null;

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col px-6 py-10">
      <Monogram text={config.monogram} className="self-center text-lg" />
      <h1 className="mt-6 text-center font-display text-3xl text-ink">Preview</h1>

      <div className="mt-6 flex-1">
        {rendering ? (
          <div className="flex aspect-[4/5] w-full items-center justify-center rounded-2xl bg-cream">
            <p className="text-sm text-ink-soft">Menyusun frame...</p>
          </div>
        ) : (
          finalDataUrl && finalType === 'image' && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={finalDataUrl} alt="Hasil foto" className="w-full rounded-2xl border border-[var(--line)] shadow-lg" />
          )
        )}
        {!rendering && finalDataUrl && finalType === 'video' && (
          <>
            <video src={finalDataUrl} controls playsInline loop className="w-full rounded-2xl border border-[var(--line)] shadow-lg" />
            <p className="mt-2 text-center text-xs text-ink-soft">Durasi: {getVideoDurationLabel(mediaItems)}</p>
          </>
        )}

        {!rendering && shots.length > 1 && (
          <div className="mt-4 flex justify-center gap-2">
            {shots.map((s, i) => (
              <button
                key={i}
                onClick={() => {
                  setRetakeIndex(i);
                  router.push('/booth');
                }}
                className="relative h-14 w-14 overflow-hidden rounded-lg border border-[var(--line)]"
                title={`Foto ulang bagian ${i + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {mediaItems[i]?.type === 'video' ? (
                  <video src={s} muted playsInline className="h-full w-full object-cover" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
                )}
              </button>
            ))}
          </div>
        )}

        {!rendering && (
          <div className="mt-5">
            <p className="text-center text-xs font-medium uppercase tracking-wide text-ink-soft">Filter</p>
            <div className="mt-2 flex gap-2 overflow-x-auto scrollbar-none pb-1">
              {PHOTO_FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilterId(f.id)}
                  className={`shrink-0 rounded-full px-4 py-2 text-xs font-medium transition ${
                    filterId === f.id ? 'bg-ink text-ivory' : 'bg-cream text-ink-soft'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5 border-y border-[var(--line)] py-4">
          <button onClick={() => setEditingText((value) => !value)} className="flex w-full items-center justify-between text-left text-sm font-medium text-ink">
            <span>{frame?.slug.startsWith('newspaper') ? 'NEWSPAPER CONTENT' : 'TEMPLATE CONTENT'}</span><span className="text-xs text-ink-soft">{editingText ? 'Selesai' : 'Edit'}</span>
          </button>
          {editingText && (
            <div className="mt-3 space-y-2">
              <details open className="border-b border-[var(--line)] pb-2">
                <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-ink">Event context</summary>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {([
                    ['eventType', 'Event type'], ['eventName', 'Event name'], ['host', 'Host / person'], ['location', 'Location'], ['tagline', 'Short tagline'],
                  ] as const).map(([key, label]) => (
                    <label key={key} className="block text-xs text-ink-soft">
                      {label}
                      <input value={templateText[key]} onChange={(event) => setTemplateText((current) => ({ ...current, [key]: event.target.value }))} className="mt-1 w-full border border-[var(--line)] bg-white px-3 py-2 text-sm text-ink outline-none focus:border-bronze" />
                    </label>
                  ))}
                </div>
              </details>
              <details open className="border-b border-[var(--line)] pb-2">
                <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-ink">Main story</summary>
                <div className="mt-2 space-y-2">
                  {([
                    ['headline', 'Main headline'], ['subheadline', 'Secondary headline'], ['article', 'Lead text'], ['caption', 'Photo caption'],
                  ] as const).map(([key, label]) => (
                    <label key={key} className="block text-xs text-ink-soft">{label}<input value={templateText[key]} onChange={(event) => setTemplateText((current) => ({ ...current, [key]: event.target.value }))} className="mt-1 w-full border border-[var(--line)] bg-white px-3 py-2 text-sm text-ink outline-none focus:border-bronze" /></label>
                  ))}
                </div>
              </details>
              <details className="pb-1">
                <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-ink">Issue details</summary>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  {([
                    ['name', 'Masthead'], ['date', 'Date'], ['edition', 'Edition'], ['issueNumber', 'Issue number'], ['quote', 'Quote'],
                  ] as const).map(([key, label]) => (
                    <label key={key} className="block text-xs text-ink-soft">{label}<input value={templateText[key]} onChange={(event) => setTemplateText((current) => ({ ...current, [key]: event.target.value }))} className="mt-1 w-full border border-[var(--line)] bg-white px-3 py-2 text-sm text-ink outline-none focus:border-bronze" /></label>
                  ))}
                </div>
              </details>
              <button type="button" onClick={() => setTemplateText((current) => generateTemplateCopy(current.eventType || 'General', current.eventName || 'today\'s event'))} className="btn-secondary w-full text-xs">Generate / Randomize Copy</button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 space-y-2">
        <div className="flex gap-2">
          <button
            onClick={() => {
              router.push('/booth');
            }}
            disabled={saving || downloading}
            className="btn-secondary flex-1 text-sm"
          >
            Retake
          </button>
          <button
            onClick={() => {
              router.push('/frame');
            }}
            disabled={saving || downloading}
            className="btn-secondary flex-1 text-sm"
          >
            Edit
          </button>
        </div>
        <button onClick={handleSave} disabled={rendering || saving || !finalDataUrl} className="btn-primary w-full">
          {saving ? 'Menyimpan...' : 'Save'}
        </button>
        <button onClick={handleDownload} disabled={rendering || downloading || !finalDataUrl} className="btn-secondary w-full">
          {downloading ? 'Menyiapkan download...' : 'Download'}
        </button>
        {saved && <p className="text-center text-xs font-medium text-bronze">Berhasil disimpan ke album.</p>}
        {downloaded && <p className="text-center text-xs font-medium text-bronze">Berhasil disimpan ke perangkat.</p>}
        {saveError && (
          <p className="text-center text-xs text-rose">
            Save gagal. Hasil tetap aman, tekan Save untuk coba lagi.
          </p>
        )}
        {downloadError && <p className="text-center text-xs text-rose">Download gagal. Tekan Download untuk coba lagi.</p>}
      </div>
    </main>
  );
}

function generateTemplateCopy(eventType: string, eventName: string) {
  const subjects = [
    'THE MOMENT EVERYONE NOTICED',
    'CAUGHT ON CAMERA',
    'TODAY\'S MAIN STORY',
    'A MOMENT WORTH KEEPING',
  ];
  const subject = subjects[Math.floor(Math.random() * subjects.length)];
  return {
    headline: subject,
    subheadline: `${eventType} highlights from ${eventName}.`,
    name: eventType === 'Wedding' ? 'THE WEDDING DAILY' : 'THE DAILY REPORT',
    date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
    quote: 'Every day has a story worth remembering.',
    article: 'A quick frame from the middle of the action, selected as one of the standout moments from the event.',
    venue: '',
    issueNumber: String(Math.floor(Math.random() * 90) + 1).padStart(2, '0'),
    eventType,
    eventName,
    host: '',
    location: '',
    tagline: 'A moment worth keeping.',
    caption: 'Captured during today\'s session.',
    edition: 'City Edition',
  };
}

async function loadMediaElement(item: { type: 'image' | 'video'; path: string }) {
  if (item.type === 'image') return loadImage(item.path);
  return new Promise<HTMLVideoElement>((resolve, reject) => {
    const video = document.createElement('video');
    video.src = item.path;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.onloadeddata = async () => {
      await video.play().catch(() => {});
      resolve(video);
    };
    video.onerror = reject;
  });
}

function getVideoDurationLabel(items: Array<{ type: 'image' | 'video'; duration?: number }>) {
  const seconds = Math.max(...items.filter((item) => item.type === 'video').map((item) => item.duration ?? 5), 0);
  return `${seconds || 5} detik`;
}

async function downloadBlob(blob: Blob, filename: string) {
  type FilePickerWindow = Window & {
    showSaveFilePicker?: (options: {
      suggestedName: string;
      types: Array<{ description: string; accept: Record<string, string[]> }>;
    }) => Promise<{ createWritable: () => Promise<{ write: (blob: Blob) => Promise<void>; close: () => Promise<void> }> }>;
  };
  const picker = (window as FilePickerWindow).showSaveFilePicker;
  if (picker) {
    const ext = filename.slice(filename.lastIndexOf('.'));
    const handle = await picker({
      suggestedName: filename,
      types: [{ description: blob.type.startsWith('video/') ? 'Video' : 'Image', accept: { [blob.type || 'application/octet-stream']: [ext] } }],
    });
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
    return;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function renderCompositeVideo({
  frame,
  media,
  wedding,
  filterCss,
  templateText,
}: {
  frame: FrameConfig;
  media: (HTMLImageElement | HTMLVideoElement)[];
  wedding: WeddingConfig;
  filterCss: string;
  templateText: Parameters<typeof renderFrame>[0]['templateText'];
}) {
  const canvas = await renderFrame({ frame, photos: media, wedding, scale: 2, mirror: false, filterCss, templateText });
  const stream = canvas.captureStream(24);
  const mimeType = ['video/mp4;codecs=h264', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'].find((t) => MediaRecorder.isTypeSupported(t));
  const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
  const chunks: Blob[] = [];
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  };
  const stopped = new Promise<Blob>((resolve) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: recorder.mimeType || 'video/webm' }));
  });
  recorder.start();
  const started = performance.now();
  const durationMs = 5000;
  await new Promise<void>((resolve) => {
    const tick = async () => {
      const fresh = await renderFrame({ frame, photos: media, wedding, scale: 2, mirror: false, filterCss, templateText });
      canvas.getContext('2d')?.drawImage(fresh, 0, 0);
      if (performance.now() - started >= durationMs) resolve();
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  recorder.stop();
  const blob = await stopped;
  return blobToDataUrl(blob);
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, base64] = dataUrl.split(',');
  const mimeMatch = /data:([^;]+);base64/.exec(meta);
  const mime = mimeMatch?.[1] ?? 'application/octet-stream';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}
