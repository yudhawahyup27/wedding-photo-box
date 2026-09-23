'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { playShutter, playTick } from './audio';

export type SessionPhase = 'idle' | 'getready' | 'counting' | 'flash' | 'paused' | 'complete';

interface Options {
  frameCount: number;
  countdown: number;
  muted: boolean;
  onCapture: (dataUrl: string) => void;
  onComplete: () => void;
  capture: () => string | null;
}

export function useCaptureSession({ frameCount, countdown, muted, onCapture, onComplete, capture }: Options) {
  const [phase, setPhase] = useState<SessionPhase>('idle');
  const [poseIndex, setPoseIndex] = useState(0);
  const [countVal, setCountVal] = useState(countdown);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    timeoutRef.current = null;
    intervalRef.current = null;
  }, []);

  const runPose = useCallback(
    (index: number) => {
      setPhase('getready');
      timeoutRef.current = setTimeout(() => {
        setPhase('counting');
        let remaining = countdown;
        setCountVal(remaining);
        if (!muted) playTick();
        intervalRef.current = setInterval(() => {
          remaining -= 1;
          if (remaining <= 0) {
            clearTimers();
            setPhase('flash');
            if (!muted) playShutter();
            const photo = capture();
            // Mobile browsers can report camera permission as ready before
            // video metadata is usable. Do not advance to preview without a
            // real captured image.
            if (!photo) {
              clearTimers();
              setPhase('idle');
              return;
            }
            onCapture(photo);
            timeoutRef.current = setTimeout(() => {
              if (index + 1 < frameCount) {
                setPoseIndex(index + 1);
                runPose(index + 1);
              } else {
                setPhase('complete');
                onComplete();
              }
            }, 420);
          } else {
            setCountVal(remaining);
            if (!muted) playTick();
          }
        }, 1000);
      }, 700);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [countdown, muted, frameCount]
  );

  const start = useCallback(() => {
    clearTimers();
    setPoseIndex(0);
    runPose(0);
  }, [clearTimers, runPose]);

  const resume = useCallback(() => {
    runPose(poseIndex);
  }, [poseIndex, runPose]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden && (phase === 'getready' || phase === 'counting' || phase === 'flash')) {
        clearTimers();
        setPhase('paused');
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => clearTimers, [clearTimers]);

  return { phase, poseIndex, countVal, start, resume };
}
