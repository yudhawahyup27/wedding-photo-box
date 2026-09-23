'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Monogram from '@/components/Monogram';

const NAV = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/sessions', label: 'Sessions' },
  { href: '/admin/frames', label: 'Frames' },
  { href: '/admin/settings', label: 'Settings' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  }

  return (
    <div className="min-h-[100dvh] bg-ivory">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] px-6 py-4">
        <div className="flex items-center gap-6">
          <Monogram text="Y & I" className="text-base" />
          <nav className="flex gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  pathname === item.href ? 'bg-ink text-ivory' : 'text-ink-soft hover:bg-cream'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <a href="/gallery" target="_blank" rel="noreferrer" className="text-sm text-ink-soft hover:text-ink">
            Lihat Gallery ↗
          </a>
          <button onClick={logout} className="btn-secondary px-4 py-2 text-xs">
            Keluar
          </button>
        </div>
      </header>
      <main className="px-6 py-8">{children}</main>
    </div>
  );
}
