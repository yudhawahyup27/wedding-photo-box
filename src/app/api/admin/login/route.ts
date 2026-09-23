import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAME, createAdminSessionToken } from '@/lib/admin/session';

export async function POST(request: NextRequest) {
  const { password } = await request.json().catch(() => ({ password: '' }));

  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return NextResponse.json({ error: 'ADMIN_PASSWORD belum dikonfigurasi di server.' }, { status: 500 });
  }
  if (password !== expected) {
    return NextResponse.json({ error: 'Password salah.' }, { status: 401 });
  }

  const token = await createAdminSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 12,
  });
  return res;
}
