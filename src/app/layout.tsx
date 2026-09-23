import type { Metadata, Viewport } from 'next';
import './globals.css';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';

export const metadata: Metadata = {
  title: 'Yudha & Ima — Photo Booth',
  description: 'Photo booth pernikahan Yudha & Ima. Abadikan momenmu, unduh, dan bagikan langsung dari HP-mu.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Y & I Photo Booth',
  },
  icons: {
    icon: '/icons/icon.svg',
    apple: '/icons/icon.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#fbf7ef',
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="bg-[var(--ivory)] text-[var(--ink)] antialiased">
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
