import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export interface RsvpGuestResult {
  id: string;
  name: string;
}

/**
 * Searches the EXISTING `rsvp` table (shared with nikah.ywp.my.id) through
 * the `search_rsvp_guests` RPC, which returns only `id` and `name` — never
 * phone, email, message, or attendance status. See migration 0001 for the
 * function definition and why an RPC is used instead of a raw table select.
 */
export async function searchRsvpGuests(query: string): Promise<RsvpGuestResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.rpc('search_rsvp_guests', { p_query: trimmed });

  if (error) {
    console.error('searchRsvpGuests failed', error);
    return [];
  }
  return (data ?? []) as RsvpGuestResult[];
}
