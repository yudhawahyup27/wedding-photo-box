'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface Options {
  /** Total idle time before showing the "Masih di sini?" prompt, in seconds. */
  timeoutSeconds: number;
  /** How long the confirmation prompt stays up before auto-resetting, in seconds. */
  warningSeconds?: number;
  onReset: () => void;
  enabled?: boolean;
}

/**
 * Tracks pointer/touch/key activity anywhere on the page. After
 * `timeoutSeconds` of silence, shows a "Masih di sini?" confirmation;
 * if there's no response within `warningSeconds`, calls onReset() to send
 * the guest back to the welcome screen and clear session state.
 */
export function useInactivityTimeout({ timeoutSeconds, warningSeconds = 10, onReset, enabled = true }: Options) {
  const [showPrompt, setShowPrompt] = useState(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (warnTimer.current) clearTimeout(warnTimer.current);
  }, []);

  const armTimers = useCallback(() => {
    clearTimers();
    setShowPrompt(false);
    if (!enabled) return;
    idleTimer.current = setTimeout(() => {
      setShowPrompt(true);
      warnTimer.current = setTimeout(() => {
        setShowPrompt(false);
        onReset();
      }, warningSeconds * 1000);
    }, timeoutSeconds * 1000);
  }, [clearTimers, enabled, onReset, timeoutSeconds, warningSeconds]);

  const stillHere = useCallback(() => {
    armTimers();
  }, [armTimers]);

  useEffect(() => {
    if (!enabled) {
      clearTimers();
      setShowPrompt(false);
      return;
    }
    const activityEvents: (keyof WindowEventMap)[] = ['pointerdown', 'touchstart', 'keydown'];
    const onActivity = () => {
      if (!showPrompt) armTimers();
    };
    activityEvents.forEach((evt) => window.addEventListener(evt, onActivity));
    armTimers();
    return () => {
      activityEvents.forEach((evt) => window.removeEventListener(evt, onActivity));
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, timeoutSeconds]);

  return { showPrompt, stillHere };
}
