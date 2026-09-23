'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Monogram from '@/components/Monogram';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (res.ok) {
      router.push('/admin');
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Gagal masuk.');
    }
  }

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-sm flex-col items-center justify-center px-6">
      <Monogram text="Y & I" className="text-lg" />
      <h1 className="mt-4 font-display text-2xl text-ink">Booth Admin</h1>
      <form onSubmit={handleSubmit} className="mt-6 w-full space-y-3">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password admin"
          className="w-full rounded-2xl border border-[var(--line)] px-4 py-3 text-sm focus:border-bronze focus:outline-none"
          autoFocus
        />
        {error && <p className="text-sm text-rose">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full text-sm">
          {loading ? 'Memeriksa...' : 'Masuk'}
        </button>
      </form>
    </main>
  );
}
