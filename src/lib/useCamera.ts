'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type CameraStatus = 'idle' | 'requesting' | 'ready' | 'denied' | 'unsupported' | 'notfound' | 'error' | 'disconnected';

export function useCamera(initialFacing: 'user' | 'environment' = 'user') {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingModeState] = useState<'user' | 'environment'>(initialFacing);
  const [status, setStatus] = useState<CameraStatus>('idle');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const start = useCallback(
    async (mode: 'user' | 'environment') => {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        setStatus('unsupported');
        return;
      }
      setStatus('requesting');
      stop();
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 960 } },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        const track = stream.getVideoTracks()[0];
        track?.addEventListener('ended', () => setStatus('disconnected'));
        setStatus('ready');

        navigator.mediaDevices.enumerateDevices().then((devices) => {
          setHasMultipleCameras(devices.filter((d) => d.kind === 'videoinput').length > 1);
        }).catch(() => {});
      } catch (err: unknown) {
        const name = err instanceof Error ? err.name : '';
        if (name === 'NotAllowedError' || name === 'PermissionDeniedError') setStatus('denied');
        else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') setStatus('notfound');
        else setStatus('error');
      }
    },
    [stop]
  );

  useEffect(() => {
    start(facingMode);
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  useEffect(() => {
    // The video element is rendered only after status becomes `ready`.
    // Bind the stream again after that render so the live preview is not blank.
    if (status !== 'ready' || !videoRef.current || !streamRef.current) return;
    if (videoRef.current.srcObject !== streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
    videoRef.current.play().catch(() => {});
  }, [status]);

  useEffect(() => {
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const switchCamera = useCallback(() => {
    setFacingModeState((m) => (m === 'user' ? 'environment' : 'user'));
  }, []);

  const setFacingMode = useCallback((m: 'user' | 'environment') => setFacingModeState(m), []);

  const capture = useCallback((mirror: boolean): string | null => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return null;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 960;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    if (mirror) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.92);
  }, []);

  const retry = useCallback(() => start(facingMode), [start, facingMode]);

  return { videoRef, streamRef, status, facingMode, switchCamera, setFacingMode, capture, retry, stop, hasMultipleCameras };
}
