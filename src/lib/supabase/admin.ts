import 'server-only';
import { createClient } from '@supabase/supabase-js';

/**
 * Privileged Supabase client using the service_role key.
 *
 * SERVER-ONLY. The `server-only` import above makes Next.js throw a build
 * error if this file is ever imported from a Client Component or anything
 * bundled to the browser. Only import this inside:
 *   - src/app/api/admin/** route handlers
 *   - other server-only modules
 *
 * This is how the admin dashboard can read/write data that guest-facing
 * RLS policies intentionally block (e.g. deleting a session, editing a
 * frame, toggling settings) without ever shipping service_role to the client.
 */
export function getSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY belum diisi di .env.local (server-only, jangan pernah dikirim ke browser).'
    );
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
