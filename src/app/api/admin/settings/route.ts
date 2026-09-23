export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.from('booth_settings').select('*').eq('id', true).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ settings: data });
}

export async function PUT(request: NextRequest) {
  const supabase = getSupabaseAdminClient();
  const body = await request.json();
  delete body.id; // the single-row primary key is fixed (id = true)
  delete body.updated_at;

  const { error } = await supabase.from('booth_settings').update({ ...body, updated_at: new Date().toISOString() }).eq('id', true);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
