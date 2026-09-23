export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const supabase = getSupabaseAdminClient();

  const [{ count: totalSessions }, { data: modeRows }, { data: guestRows }, { count: photosToday }, { data: sumRows }, { data: frameRows }, { data: latest }] =
    await Promise.all([
      supabase.from('photo_sessions').select('id', { count: 'exact', head: true }),
      supabase.from('photo_sessions').select('mode'),
      supabase.from('photo_sessions').select('guest_id,guest_name'),
      supabase
        .from('photo_sessions')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
      supabase.from('photo_sessions').select('download_count,share_count,print_count'),
      supabase.from('photo_sessions').select('frame_slug'),
      supabase.from('photo_sessions').select('id,guest_name,mode,created_at').order('created_at', { ascending: false }).limit(8),
    ]);

  const modeCounts: Record<string, number> = {};
  (modeRows ?? []).forEach((r) => {
    modeCounts[r.mode] = (modeCounts[r.mode] ?? 0) + 1;
  });

  const uniqueGuests = new Set(
    (guestRows ?? []).map((r) => r.guest_id ?? (r.guest_name ? `name:${r.guest_name}` : null)).filter(Boolean)
  ).size;

  const totals = (sumRows ?? []).reduce(
    (acc, r) => ({
      downloads: acc.downloads + (r.download_count ?? 0),
      shares: acc.shares + (r.share_count ?? 0),
      prints: acc.prints + (r.print_count ?? 0),
    }),
    { downloads: 0, shares: 0, prints: 0 }
  );

  const frameCounts: Record<string, number> = {};
  (frameRows ?? []).forEach((r) => {
    if (r.frame_slug) frameCounts[r.frame_slug] = (frameCounts[r.frame_slug] ?? 0) + 1;
  });
  const mostPopularFrame = Object.entries(frameCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  return NextResponse.json({
    totalSessions: totalSessions ?? 0,
    modeCounts,
    uniqueGuests,
    photosToday: photosToday ?? 0,
    ...totals,
    mostPopularFrame,
    latest: latest ?? [],
  });
}
