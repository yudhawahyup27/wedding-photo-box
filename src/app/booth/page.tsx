'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCamera } from '@/lib/useCamera';
import { useCaptureSession } from '@/lib/useCaptureSession';
import { useBoothStore } from '@/lib/booth/store';
import { useWeddingConfig } from '@/lib/wedding/useWeddingConfig';
import {
  Camera,
  ChevronLeft,
  RotateCcw,
  Sparkles,
  SwitchCamera,
  Timer,
  Video as VideoIcon,
  CheckCircle2,
  AlertCircle,
  Film
} from 'lucide-react';

export default function BoothCapturePage() {
  const router = useRouter();
  const { config } = useWeddingConfig();
  const frame = useBoothStore((s) => s.frame);
  const shots = useBoothStore((s) => s.shots);
  const captureType = useBoothStore((s) => s.captureType);
  const addShot = useBoothStore((s) => s.addShot);
  const addMediaItem = useBoothStore((s) => s.addMediaItem);
  const clearShots = useBoothStore((s) => s.clearShots);
  const retakeIndex = useBoothStore((s) => s.retakeIndex);
  const continueCapture = useBoothStore((s) => s.continueCapture);
  const replaceShot = useBoothStore((s) => s.replaceShot);
  const replaceMediaItem = useBoothStore((s) => s.replaceMediaItem);
  const setRetakeIndex = useBoothStore((s) => s.setRetakeIndex);
  const setContinueCapture = useBoothStore((s) => s.setContinueCapture);

  const isRetake = retakeIndex !== null;

  const [countdown, setCountdown] = useState<3 | 5 | 10>(config.defaultCountdown);
  const { videoRef, streamRef, status, switchCamera, capture, retry, hasMultipleCameras } = useCamera('user');
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const recordSecondsRef = useRef(0);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const frameCount = isRetake
    ? 1
    : continueCapture
      ? Math.max(1, (frame?.photoCount ?? 1) - shots.length)
      : frame?.photoCount ?? 1;

  const { phase, poseIndex, countVal, start } = useCaptureSession({
    frameCount,
    countdown,
    muted: false,
    capture: () => capture(true),
    onCapture: (dataUrl) => {
      if (isRetake && retakeIndex !== null) {
        replaceShot(retakeIndex, dataUrl);
      } else {
        addShot(dataUrl);
      }
    },
    onComplete: () => {
      if (isRetake) {
        setRetakeIndex(null);
      }
      setContinueCapture(false);
      router.push('/preview');
    },
  });

  async function startRecording() {
    if (!streamRef.current || recording) return;
    const mimeType = ['video/mp4;codecs=h264', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'].find((t) =>
      MediaRecorder.isTypeSupported(t)
    );
    chunksRef.current = [];
    const recorder = new MediaRecorder(streamRef.current, mimeType ? { mimeType } : undefined);
    recorderRef.current = recorder;
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'video/webm' });
      const dataUrl = await blobToDataUrl(blob);
      const item = {
        type: 'video' as const,
        path: dataUrl,
        duration: recordSecondsRef.current,
        width: videoRef.current?.videoWidth,
        height: videoRef.current?.videoHeight,
      };
      if (isRetake && retakeIndex !== null) {
        replaceMediaItem(retakeIndex, item);
        setRetakeIndex(null);
      } else {
        addMediaItem(item);
      }
      setRecording(false);
      setRecordSeconds(0);
      if ((isRetake ? 1 : shots.length + 1) >= frameCount) router.push('/preview');
    };
    recorder.start();
    setRecording(true);
    setRecordSeconds(0);
    recordSecondsRef.current = 0;
    recordTimerRef.current = setInterval(() => {
      recordSecondsRef.current += 1;
      setRecordSeconds(recordSecondsRef.current);
    }, 1000);
    window.setTimeout(() => stopRecording(), 10000);
  }

  function stopRecording() {
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    recordTimerRef.current = null;
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
  }

  useEffect(() => {
    if (!frame) router.replace('/frame');
  }, [frame, router]);

  const safeAreaRatio = useMemo(() => {
    if (!frame) return 4 / 5;
    const slot = frame.photoSlots[0];
    return slot ? slot.width / slot.height : 4 / 5;
  }, [frame]);

  if (!frame) return null;

  const isCapturing = recording || (phase !== 'idle' && phase !== 'complete' && phase !== 'paused');
  const currentPoseNumber = Math.min((captureType === 'video' ? shots.length : poseIndex) + 1, frameCount);

  return (
    <main className="relative flex h-[100dvh] w-full flex-col justify-between overflow-hidden bg-[#12100e] text-[#fbf7ef] select-none">
      {/* Viewfinder Studio Area */}
      <div className="relative flex-1 overflow-hidden">
        {/* Live Camera Stream */}
        {status === 'ready' && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
          />
        )}

        {/* Camera States / Error Handling */}
        {status !== 'ready' && (
          <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
            {status === 'requesting' && (
              <div className="flex flex-col items-center gap-3">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
                <p className="font-display text-lg text-amber-200">Mengakses Kamera Studio...</p>
                <p className="text-xs text-stone-400">Izinkan akses kamera pada browser Anda.</p>
              </div>
            )}
            {status === 'denied' && (
              <div className="max-w-xs space-y-3 rounded-2xl border border-red-500/30 bg-red-950/40 p-6 backdrop-blur-md">
                <AlertCircle className="mx-auto h-8 w-8 text-red-400" />
                <p className="font-display text-xl text-white">Izin Kamera Ditolak</p>
                <p className="text-xs text-stone-300">
                  Mohon izinkan akses kamera di pengaturan browser agar photo booth dapat mengambil foto.
                </p>
                <button
                  onClick={retry}
                  className="mt-2 w-full rounded-full bg-amber-500 px-4 py-2.5 text-xs font-bold text-black transition hover:bg-amber-400"
                >
                  Coba Sambungkan Lagi
                </button>
              </div>
            )}
            {status === 'notfound' && (
              <p className="text-sm text-stone-300">Kamera tidak ditemukan di perangkat ini.</p>
            )}
            {status === 'unsupported' && (
              <p className="text-sm text-stone-300">Browser ini tidak mendukung akses kamera.</p>
            )}
            {(status === 'error' || status === 'disconnected') && (
              <div className="space-y-3">
                <p className="text-sm text-stone-300">Terjadi gangguan sambungan kamera.</p>
                <button
                  onClick={retry}
                  className="rounded-full bg-amber-500 px-5 py-2 text-xs font-bold text-black"
                >
                  Hubungkan Ulang
                </button>
              </div>
            )}
          </div>
        )}

        {/* Luxury Safe-Area Frame Guide & Reticle */}
        {status === 'ready' && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4 sm:p-8">
            <div
              className="relative h-full max-h-full rounded-2xl border border-amber-300/40 shadow-[0_0_40px_rgba(0,0,0,0.5)]"
              style={{ aspectRatio: safeAreaRatio }}
            >
              {/* Studio Reticle Corners */}
              <div className="absolute -left-1 -top-1 h-5 w-5 border-l-2 border-t-2 border-amber-400" />
              <div className="absolute -right-1 -top-1 h-5 w-5 border-r-2 border-t-2 border-amber-400" />
              <div className="absolute -bottom-1 -left-1 h-5 w-5 border-b-2 border-l-2 border-amber-400" />
              <div className="absolute -bottom-1 -right-1 h-5 w-5 border-b-2 border-r-2 border-amber-400" />

              {/* Center subtle crosshair */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-3 w-3">
                <div className="absolute left-1/2 top-0 h-full w-[1px] -translate-x-1/2 bg-amber-300/20" />
                <div className="absolute left-0 top-1/2 h-[1px] w-full -translate-y-1/2 bg-amber-300/20" />
              </div>
            </div>
          </div>
        )}

        {/* Top Header Overlay Bar */}
        <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between p-4 sm:p-6 bg-gradient-to-b from-black/70 via-black/30 to-transparent">
          <button
            onClick={() => {
              if (isRetake) {
                setRetakeIndex(null);
                router.push('/preview');
              } else {
                router.push('/frame');
              }
            }}
            disabled={isCapturing}
            className="flex items-center gap-1.5 rounded-full border border-white/20 bg-black/40 px-3.5 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-md transition hover:bg-black/70 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>{isRetake ? 'Batal Retake' : 'Pilih Frame'}</span>
          </button>

          {/* Frame Title Badge */}
          <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-black/50 px-4 py-1.5 text-xs font-semibold text-amber-200 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>{frame.title}</span>
            <span className="text-white/40">•</span>
            <span className="text-white/80">{frameCount} Foto</span>
          </div>

          {/* Right Action: Camera Switcher */}
          <div className="flex items-center gap-2">
            {hasMultipleCameras && (
              <button
                onClick={switchCamera}
                disabled={isCapturing}
                className="flex items-center gap-1.5 rounded-full border border-white/20 bg-black/40 px-3 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-md transition hover:bg-black/70 disabled:opacity-40"
                title="Ganti Kamera"
              >
                <SwitchCamera className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Kamera</span>
              </button>
            )}
          </div>
        </div>

        {/* Multi-shot Progress Strip (Floating Top Center) */}
        {frameCount > 1 && status === 'ready' && (
          <div className="absolute top-16 sm:top-20 inset-x-0 z-20 flex flex-col items-center gap-2 px-4 pointer-events-none">
            <div className="flex items-center gap-2 rounded-full border border-amber-500/40 bg-black/60 px-4 py-1.5 text-xs font-bold text-amber-100 backdrop-blur-md shadow-lg">
              <Film className="h-3.5 w-3.5 text-amber-400" />
              <span>
                Pose {currentPoseNumber} dari {frameCount}
              </span>
            </div>

            {/* Pose thumbnails or dots */}
            <div className="flex items-center gap-1.5 rounded-full bg-black/50 p-1.5 backdrop-blur-md border border-white/10">
              {Array.from({ length: frameCount }).map((_, idx) => {
                const isDone = idx < (captureType === 'video' ? shots.length : isRetake ? 0 : shots.length);
                const isCurrent = idx === (captureType === 'video' ? shots.length : poseIndex);
                const shotThumbnail = shots[idx];

                return (
                  <div
                    key={idx}
                    className={`relative flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border text-[10px] font-bold transition-all duration-300 ${
                      isDone
                        ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                        : isCurrent
                        ? 'scale-110 border-amber-300 bg-amber-400 text-black shadow-md shadow-amber-500/50 ring-2 ring-amber-300/40'
                        : 'border-white/20 bg-white/5 text-white/40'
                    }`}
                  >
                    {isDone && shotThumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={shotThumbnail} alt={`Pose ${idx + 1}`} className="h-full w-full object-cover" />
                    ) : isDone ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-amber-400" />
                    ) : (
                      idx + 1
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Countdown & Get Ready Overlays */}
        {(phase === 'counting' || phase === 'getready') && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px]">
            {phase === 'getready' ? (
              <div className="count-pop flex flex-col items-center gap-3 px-6 text-center">
                <div className="rounded-full border border-amber-400/40 bg-black/60 px-5 py-2 backdrop-blur-md">
                  <span className="text-xs font-semibold uppercase tracking-widest text-amber-300">
                    Pose #{currentPoseNumber}
                  </span>
                </div>
                <p className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-white drop-shadow-md">
                  Siap? Berikan Senyum Terbaik!
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="relative flex h-40 w-40 items-center justify-center">
                  <div className="absolute inset-0 animate-ping rounded-full border-2 border-amber-400/30" />
                  <div className="absolute inset-2 rounded-full border-2 border-amber-400/80 bg-black/50 backdrop-blur-md shadow-[0_0_50px_rgba(217,178,102,0.4)]" />
                  <span
                    key={countVal}
                    className="count-pop relative font-display text-8xl font-bold text-amber-300 drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]"
                  >
                    {countVal}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* High energy flash animation */}
        {phase === 'flash' && <div className="absolute inset-0 z-40 bg-white flash-pop" />}
      </div>

      {/* Bottom Controls Studio Deck */}
      <div className="relative z-20 flex flex-col items-center bg-gradient-to-t from-[#0e0c0b] via-[#161311] to-transparent px-6 pb-8 pt-4">
        {/* Countdown Timer Selector (When not capturing) */}
        {!isCapturing && captureType === 'photo' && (
          <div className="mb-4 flex items-center gap-2 rounded-full border border-white/10 bg-black/40 p-1 backdrop-blur-md">
            <span className="pl-3 pr-1 text-[11px] font-medium text-stone-400 flex items-center gap-1">
              <Timer className="h-3 w-3 text-amber-400" />
              Timer:
            </span>
            {[3, 5, 10].map((c) => (
              <button
                key={c}
                onClick={() => setCountdown(c as 3 | 5 | 10)}
                className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
                  countdown === c
                    ? 'bg-amber-400 text-black shadow-sm'
                    : 'text-stone-300 hover:bg-white/10'
                }`}
              >
                {c}s
              </button>
            ))}
          </div>
        )}

        {/* Video Recording Live Duration */}
        {recording && (
          <div className="mb-4 flex items-center gap-2 rounded-full border border-red-500/50 bg-red-950/70 px-4 py-1.5 backdrop-blur-md animate-pulse">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
            <span className="text-xs font-mono font-bold tracking-wider text-red-100">
              MEREKAM 00:{recordSeconds < 10 ? `0${recordSeconds}` : recordSeconds} / 00:10
            </span>
          </div>
        )}

        {/* Capture Buttons Bar */}
        <div className="flex w-full max-w-sm items-center justify-between gap-4">
          {/* Left Action / Retake or Back */}
          <button
            onClick={() => {
              if (isRetake) {
                setRetakeIndex(null);
                router.push('/preview');
              } else {
                router.push('/frame');
              }
            }}
            disabled={isCapturing}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/5 text-stone-300 backdrop-blur-md transition hover:bg-white/15 hover:text-white disabled:opacity-30"
            title="Kembali"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {/* Primary Shutter Trigger */}
          {captureType === 'photo' ? (
            <button
              onClick={() => {
                if (!isRetake && !continueCapture && shots.length === 0) clearShots();
                start();
              }}
              disabled={status !== 'ready' || isCapturing}
              className="group relative flex h-20 w-20 items-center justify-center rounded-full transition-transform active:scale-95 disabled:pointer-events-none disabled:opacity-40"
            >
              {/* Outer Golden Glowing Ring */}
              <div className="absolute inset-0 rounded-full border-2 border-amber-400/80 shadow-[0_0_25px_rgba(217,178,102,0.45)] group-hover:border-amber-300 group-hover:shadow-[0_0_35px_rgba(217,178,102,0.7)] transition-all" />
              {/* Inner Button Shutter Disc */}
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 via-amber-300 to-amber-100 text-stone-950 shadow-md transition-all group-hover:scale-105">
                <Camera className="h-7 w-7 text-stone-950 transition-transform group-hover:rotate-6" />
              </div>
            </button>
          ) : recording ? (
            <button
              onClick={stopRecording}
              className="group relative flex h-20 w-20 items-center justify-center rounded-full transition-transform active:scale-95"
            >
              <div className="absolute inset-0 rounded-full border-2 border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.5)] animate-pulse" />
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white shadow-md">
                <div className="h-6 w-6 rounded-sm bg-white" />
              </div>
            </button>
          ) : (
            <button
              onClick={startRecording}
              disabled={status !== 'ready'}
              className="group relative flex h-20 w-20 items-center justify-center rounded-full transition-transform active:scale-95 disabled:pointer-events-none disabled:opacity-40"
            >
              <div className="absolute inset-0 rounded-full border-2 border-red-400/80 shadow-[0_0_25px_rgba(239,68,68,0.4)]" />
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-red-600 to-rose-400 text-white shadow-md">
                <VideoIcon className="h-7 w-7" />
              </div>
            </button>
          )}

          {/* Right Action: Clear / Retake Reset or Camera Switch */}
          {shots.length > 0 && !isCapturing ? (
            <button
              onClick={() => clearShots()}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/5 text-stone-300 backdrop-blur-md transition hover:bg-white/15 hover:text-white"
              title="Reset Foto"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
          ) : (
            <button
              onClick={switchCamera}
              disabled={isCapturing || !hasMultipleCameras}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/5 text-stone-300 backdrop-blur-md transition hover:bg-white/15 hover:text-white disabled:opacity-20"
              title="Ganti Kamera"
            >
              <SwitchCamera className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Guidance Subtext */}
        <p className="mt-3 text-[11px] font-medium text-stone-400">
          {isCapturing
            ? 'Tetap di posisi dan tersenyum...'
            : isRetake
            ? 'Ambil pose baru untuk menggantikan foto ini'
            : 'Sentuh tombol emas untuk mulai sesi foto'}
        </p>
      </div>
    </main>
  );
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
