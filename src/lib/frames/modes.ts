import type { PhotoMode } from './types';

export interface ModeInfo {
  label: string;
  description: string;
}
/** One metadata entry for every supported booth mode. */
export const MODE_INFO: Record<PhotoMode, ModeInfo> = {
  photo: { label: 'Photo', description: 'Potret pernikahan klasik.' },
  strip: { label: 'Photo Strip', description: 'Beberapa foto dalam satu strip cetak.',  },
  gif: { label: 'GIF', description: 'Beberapa momen jadi satu loop singkat.',  },
  boomerang: { label: 'Boomerang', description: 'Gerakan singkat maju-mundur.',  },
  video: { label: 'Short Video', description: 'Rekam pesan video singkat.', },
  classic: { label: 'Classic', description: 'Classic wedding photo booth.' },
  magazine: { label: 'Magazine', description: 'Editorial magazine-style photo booth' },
  newspaper: { label: 'Newspaper', description: 'Newspaper front-page style photo booth' },
  photobook: { label: 'Photo Book', description: 'Elegant wedding photo album layout' },
};

export const PHOTO_MODES: PhotoMode[] = [
  'photo',
  'classic',
  'magazine',
  'newspaper',
  'photobook',
  'strip',
  'gif',
  'boomerang',
  'video',
];

const FALLBACK_MODE_INFO: ModeInfo = {
  label: 'Photo Booth',
  description: 'Photo booth mode',
};

/** Safely resolves mode IDs received from query params or persisted settings. */
export function getModeInfo(mode: string | null | undefined): ModeInfo {
  if (mode && Object.prototype.hasOwnProperty.call(MODE_INFO, mode)) return MODE_INFO[mode as PhotoMode];
  return { ...FALLBACK_MODE_INFO, ...(mode ? { label: mode } : {}) };
}

export function isPhotoMode(value: unknown): value is PhotoMode {
  return typeof value === 'string' && PHOTO_MODES.includes(value as PhotoMode);
}

export function normalizePhotoMode(value: unknown): PhotoMode {
  if (isPhotoMode(value)) return value;

  if (typeof value === 'string') {
    const normalized = value.toLowerCase().trim();
    const aliases: Record<string, PhotoMode> = {
      'photo-strip': 'strip',
      photo_strip: 'strip',
      'short-video': 'video',
      short_video: 'video',
      'photo-book': 'photobook',
      photo_book: 'photobook',
    };

    if (isPhotoMode(normalized)) return normalized;
    if (aliases[normalized]) return aliases[normalized];
  }

  if (process.env.NODE_ENV !== 'production') {
    console.warn('[PhotoBooth] Invalid mode:', value);
  }

  return 'photo';
}
