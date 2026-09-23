import QRCode from 'qrcode';

export function buildPublicPhotoUrl(qrToken: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || '';
  return `${base}/photo/${qrToken}`;
}

export function buildAlbumUrl(): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || '';
  return `${base}/gallery`;
}

export async function generateQrDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    width: 480,
    margin: 1,
    color: { dark: '#2B2620', light: '#00000000' },
  });
}
