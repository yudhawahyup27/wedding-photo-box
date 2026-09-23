import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export interface GuestbookEntryInput {
  name: string;
  message: string;
}

/**
 * Submits a wish through the booth into the SAME `rsvp` table already used
 * by nikah.ywp.my.id's Digital Guestbook — no new guestbook table is
 * created. Because a message submitted at the booth is not necessarily an
 * RSVP attendance response, `attending` is left as its column default
 * rather than guessed at; if the existing schema requires a non-null value
 * here, set ATTENDING_DEFAULT below to match what the wedding site's own
 * RSVP form sends for "not specified" (confirm with the site's source).
 */
const ATTENDING_DEFAULT: boolean | null = null;

export async function submitGuestbookEntry({ name, message }: GuestbookEntryInput) {
  const supabase = getSupabaseBrowserClient();

  const payload: Record<string, unknown> = {
    name: name.trim(),
    message: message.trim(),
  };
  if (ATTENDING_DEFAULT !== null) {
    payload.attending = ATTENDING_DEFAULT;
  }

  const { error } = await supabase.from('rsvp').insert(payload);
  if (error) throw error;
}
