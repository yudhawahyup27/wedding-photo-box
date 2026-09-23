'use client';

import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Single shared browser Supabase client for the whole booth app.
 * Uses the PUBLIC anon key only — this file must never import the
 * service_role key. Reuses the SAME Supabase project as nikah.ywp.my.id.
 */
let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient {
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'Supabase belum dikonfigurasi. Isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY di .env.local'
    );
  }

  browserClient = createClient(url, anonKey, {
    auth: {
      // The booth has no guest-facing login; only /admin uses its own
      // lightweight cookie session (see src/lib/admin/session.ts).
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return browserClient;
}
