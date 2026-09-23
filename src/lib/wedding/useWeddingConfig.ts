'use client';

import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { DEFAULT_WEDDING_CONFIG, WeddingConfig } from './config';
import { isPhotoMode, normalizePhotoMode } from '@/lib/frames/modes';

interface BoothSettingsRow {
  couple_names: string;
  monogram: string;
  wedding_date: string;
  hashtag: string;
  album_url: string;
  welcome_title: string;
  welcome_subtitle: string;
  completion_title: string;
  completion_message: string;
  default_mode: string;
  enabled_modes: string[];
  default_countdown: number;
  default_frame_slug: string;
  allow_rsvp_search: boolean;
  allow_print: boolean;
  print_copies: number;
  allow_gallery: boolean;
  allow_live_gallery: boolean;
  allow_digital_guestbook: boolean;
  allow_audio_guestbook: boolean;
  allow_sharing: boolean;
  auto_reset_seconds: number;
}

function rowToConfig(row: BoothSettingsRow): WeddingConfig {
  const defaultMode = normalizePhotoMode(row.default_mode);
  const enabledModes = (row.enabled_modes ?? []).map(normalizePhotoMode).filter(isPhotoMode);

  return {
    coupleNames: row.couple_names,
    monogram: row.monogram,
    weddingDate: row.wedding_date,
    hashtag: row.hashtag,
    albumUrl: row.album_url,
    welcomeTitle: row.welcome_title,
    welcomeSubtitle: row.welcome_subtitle,
    completionTitle: row.completion_title,
    completionMessage: row.completion_message,
    defaultMode,
    enabledModes: enabledModes.length > 0 ? enabledModes : DEFAULT_WEDDING_CONFIG.enabledModes,
    defaultCountdown: row.default_countdown as 3 | 5 | 10,
    defaultFrameSlug: row.default_frame_slug,
    allowRsvpSearch: row.allow_rsvp_search,
    allowPrint: row.allow_print,
    printCopies: row.print_copies,
    allowGallery: row.allow_gallery,
    allowLiveGallery: row.allow_live_gallery,
    allowDigitalGuestbook: row.allow_digital_guestbook,
    allowAudioGuestbook: row.allow_audio_guestbook,
    allowSharing: row.allow_sharing,
    autoResetSeconds: row.auto_reset_seconds,
  };
}

export function useWeddingConfig() {
  const [config, setConfig] = useState<WeddingConfig>(DEFAULT_WEDDING_CONFIG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase.from('booth_settings').select('*').eq('id', true).maybeSingle();
        if (!cancelled && !error && data) {
          setConfig(rowToConfig(data as BoothSettingsRow));
        }
      } catch {
        // Keep defaults — booth stays usable even if Supabase is unreachable.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { config, loading };
}
