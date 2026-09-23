import type { PhotoMode } from '@/lib/frames/types';
import { PHOTO_MODES } from '@/lib/frames/modes';

/**
 * Default booth settings. On load, the app tries to fetch a matching row
 * from `booth_settings` (see supabase/migrations/0001_photo_booth_schema.sql)
 * and merges it over these defaults, so the event can be reconfigured from
 * /admin/settings without a redeploy. If Supabase is unreachable (offline
 * kiosk boot, etc.) these defaults keep the booth usable.
 */
export interface WeddingConfig {
  coupleNames: string;
  monogram: string;
  weddingDate: string; // ISO date, e.g. "2026-11-14"
  hashtag: string;
  albumUrl: string;
  welcomeTitle: string;
  welcomeSubtitle: string;
  completionTitle: string;
  completionMessage: string;
  defaultMode: PhotoMode;
  enabledModes: PhotoMode[];
  defaultCountdown: 3 | 5 | 10;
  defaultFrameSlug: string;
  allowRsvpSearch: boolean;
  allowPrint: boolean;
  printCopies: number;
  allowGallery: boolean;
  allowLiveGallery: boolean;
  allowDigitalGuestbook: boolean;
  allowAudioGuestbook: boolean;
  allowSharing: boolean;
  autoResetSeconds: number;
}

export const DEFAULT_WEDDING_CONFIG: WeddingConfig = {
  coupleNames: 'Yudha & Ima',
  monogram: 'Y & I',
  weddingDate: '2026-11-14',
  hashtag: '#YudhaIma',
  albumUrl: '/gallery',
  welcomeTitle: 'Yudha & Ima',
  welcomeSubtitle: 'Abadikan momenmu bersama kami.',
  completionTitle: 'Memory Saved',
  completionMessage: 'Terima kasih sudah menjadi bagian dari cerita kami.',
  defaultMode: 'photo',
  enabledModes: PHOTO_MODES,
  defaultCountdown: 3,
  defaultFrameSlug: 'y-i-signature',
  allowRsvpSearch: true,
  allowPrint: true,
  printCopies: 2,
  allowGallery: true,
  allowLiveGallery: true,
  allowDigitalGuestbook: true,
  allowAudioGuestbook: false,
  allowSharing: true,
  autoResetSeconds: 60,
};

/** Modes that exist in the architecture but aren't implemented yet (Phase 3). */
export const UPCOMING_MODES: PhotoMode[] = ['gif', 'boomerang', 'video'];
