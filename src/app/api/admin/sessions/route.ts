export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const supabase = getSupabaseAdminClient();
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const mode = searchParams.get('mode');

  let query = supabase
    .from('photo_sessions')
    .select('id,guest_name,mode,frame_slug,qr_token,is_public,download_count,share_count,print_count,created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  if (q) query = query.ilike('guest_name', `%${q}%`);
  if (mode) query = query.eq('mode', mode);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sessions: data });
}

export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdminClient();
  const body = await request.json();
  const { action, id } = body as { action: string; id: string };

  if (!id) return NextResponse.json({ error: 'id wajib diisi' }, { status: 400 });

  if (action === 'toggle-visibility') {
    const { data: current } = await supabase.from('photo_sessions').select('is_public').eq('id', id).single();
    const { error } = await supabase
      .from('photo_sessions')
      .update({ is_public: !current?.is_public })
      .eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === 'delete') {
    // Assets cascade via FK (on delete cascade). Storage objects are left
    // in place intentionally — a background cleanup job can sweep orphaned
    // paths later; deleting them synchronously here isn't essential for
    // Phase 1/2 reliability.
    const { error } = await supabase.from('photo_sessions').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'action tidak dikenal' }, { status: 400 });
}
