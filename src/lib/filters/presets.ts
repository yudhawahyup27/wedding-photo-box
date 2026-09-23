export interface PhotoFilter {
  id: string;
  label: string;
  /** CSS filter string, applied to each photo slot via ctx.filter before drawImage. */
  css: string;
}

export const PHOTO_FILTERS: PhotoFilter[] = [
  { id: 'original', label: 'Original', css: 'none' },
  { id: 'clean', label: 'Clean', css: 'saturate(1.04) contrast(1.02)' },
  { id: 'bw', label: 'Hitam Putih', css: 'grayscale(1) contrast(1.05)' },
  { id: 'high-contrast-bw', label: 'High Contrast B&W', css: 'grayscale(1) contrast(1.3)' },
  { id: 'newspaper-print', label: 'Newspaper Print', css: 'grayscale(1) contrast(1.18) brightness(1.04)' },
  { id: 'sepia', label: 'Sepia', css: 'sepia(0.75) contrast(1.05) brightness(1.02)' },
  { id: 'vintage', label: 'Vintage Film', css: 'sepia(0.28) saturate(1.15) contrast(1.08) brightness(1.03)' },
  { id: 'warm', label: 'Warm', css: 'saturate(1.25) hue-rotate(-8deg) brightness(1.03) contrast(1.03)' },
  { id: 'cool', label: 'Cool', css: 'saturate(1.15) hue-rotate(10deg) brightness(1.02) contrast(1.03)' },
  { id: 'faded', label: 'Faded', css: 'saturate(0.72) contrast(0.92) brightness(1.06)' },
  { id: 'matte', label: 'Matte', css: 'saturate(0.9) contrast(0.96) brightness(1.04)' },
  { id: 'grain', label: 'Grain', css: 'contrast(1.08) saturate(0.92)' },
  { id: 'halftone', label: 'Halftone', css: 'grayscale(0.7) contrast(1.22)' },
];

export function getFilterById(id: string): PhotoFilter {
  return PHOTO_FILTERS.find((f) => f.id === id) ?? PHOTO_FILTERS[0];
}
