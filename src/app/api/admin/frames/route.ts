export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('photo_frames')
    .select('id,name,slug,category,orientation,photo_count,is_active,sort_order')
    .order('sort_order', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ frames: data });
}

export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdminClient();
  const body = await request.json();
  const { action, id, sortOrder } = body as { action: string; id: string; sortOrder?: number };

  if (action === 'toggle-active') {
    const { data: current } = await supabase.from('photo_frames').select('is_active').eq('id', id).single();
    const { error } = await supabase.from('photo_frames').update({ is_active: !current?.is_active }).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === 'reorder' && typeof sortOrder === 'number') {
    const { error } = await supabase.from('photo_frames').update({ sort_order: sortOrder }).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'action tidak dikenal' }, { status: 400 });
}
