'use client';

import { create } from 'zustand';
import type { CaptureType, FrameConfig, MediaItem, PhotoMode } from '@/lib/frames/types';

export interface IdentifiedGuest {
  id: string | null; // rsvp.id when picked from search, else null
  name: string | null; // manual/rsvp name, else null for fully anonymous
}

interface BoothState {
  guest: IdentifiedGuest | null;
  mode: PhotoMode;
  captureType: CaptureType;
  frame: FrameConfig | null;
  /** Raw captured shots (data URLs), in slot order. */
  shots: string[];
  mediaItems: MediaItem[];
  /** Rendered final composite, once frame + shots are combined. */
  finalDataUrl: string | null;
  finalType: 'image' | 'video';
  /** Set once the session + assets are saved to Supabase. */
  sessionId: string | null;
  qrToken: string | null;
  retakeIndex: number | null;
  continueCapture: boolean;
  filterId: string;

  setGuest: (guest: IdentifiedGuest | null) => void;
  setMode: (mode: PhotoMode) => void;
  setCaptureType: (type: CaptureType) => void;
  setFrame: (frame: FrameConfig | null) => void;
  addShot: (dataUrl: string) => void;
  addMediaItem: (item: MediaItem) => void;
  replaceShot: (index: number, dataUrl: string) => void;
  replaceMediaItem: (index: number, item: MediaItem) => void;
  clearShots: () => void;
  setFinal: (dataUrl: string | null, type?: 'image' | 'video') => void;
  setSaved: (sessionId: string, qrToken: string) => void;
  setRetakeIndex: (index: number | null) => void;
  setContinueCapture: (value: boolean) => void;
  setFilterId: (id: string) => void;
  /** Full reset between guests — must clear everything, incl. media refs. */
  reset: () => void;
}

const initial = {
  guest: null,
  mode: 'photo' as PhotoMode,
  captureType: 'photo' as CaptureType,
  frame: null,
  shots: [] as string[],
  mediaItems: [] as MediaItem[],
  finalDataUrl: null,
  finalType: 'image' as const,
  sessionId: null,
  qrToken: null,
  retakeIndex: null,
  continueCapture: false,
  filterId: 'original',
};

export const useBoothStore = create<BoothState>((set) => ({
  ...initial,
  setGuest: (guest) => set({ guest }),
  setMode: (mode) => set({ mode }),
  setCaptureType: (captureType) => set({ captureType }),
  setFrame: (frame) => set({ frame }),
  addShot: (dataUrl) => set((s) => ({ shots: [...s.shots, dataUrl], mediaItems: [...s.mediaItems, { type: 'image', path: dataUrl }] })),
  addMediaItem: (item) => set((s) => ({ mediaItems: [...s.mediaItems, item], shots: [...s.shots, item.path] })),
  replaceShot: (index, dataUrl) =>
    set((s) => {
      const shots = [...s.shots];
      const mediaItems = [...s.mediaItems];
      shots[index] = dataUrl;
      mediaItems[index] = { type: 'image', path: dataUrl };
      return { shots, mediaItems };
    }),
  replaceMediaItem: (index, item) =>
    set((s) => {
      const mediaItems = [...s.mediaItems];
      const shots = [...s.shots];
      mediaItems[index] = item;
      shots[index] = item.path;
      return { mediaItems, shots };
    }),
  clearShots: () => set({ shots: [], mediaItems: [], finalDataUrl: null, finalType: 'image' }),
  setFinal: (dataUrl, type = 'image') => set({ finalDataUrl: dataUrl, finalType: type }),
  setSaved: (sessionId, qrToken) => set({ sessionId, qrToken }),
  setRetakeIndex: (index) => set({ retakeIndex: index }),
  setContinueCapture: (continueCapture) => set({ continueCapture }),
  setFilterId: (id) => set({ filterId: id }),
  reset: () => set({ ...initial }),
}));
