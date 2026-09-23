'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    // Never let a stale offline cache interfere with Next.js HMR or hydration
    // while running the local development server.
    if (process.env.NODE_ENV !== 'production') {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((registration) => registration.unregister());
        });
      }
      return;
    }
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js?v=2').catch(() => {
        // Registration failed silently — app still works without offline support.
      });
    }
  }, []);
  return null;
}
