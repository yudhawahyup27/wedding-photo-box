import type { FrameConfig, FrameDecoration, FrameText, PhotoSlot } from './types';

let counter = 0;
export function nextId(slug: string) {
  counter += 1;
  return `${slug}-${counter}`;
}

export function slot(x: number, y: number, width: number, height: number, extra: Partial<PhotoSlot> = {}): PhotoSlot {
  return { x, y, width, height, radius: 10, ...extra };
}

export function text(value: string, x: number, y: number, size: number, extra: Partial<FrameText> = {}): FrameText {
  return { value, x, y, size, align: 'center', color: '#2B2620', role: 'display', ...extra };
}

export function deco(kind: FrameDecoration['kind'], extra: Partial<FrameDecoration> = {}): FrameDecoration {
  return { kind, ...extra };
}

export function frame(config: Omit<FrameConfig, 'id' | 'sortOrder'> & { sortOrder?: number }): FrameConfig {
  return {
    id: nextId(config.slug),
    sortOrder: config.sortOrder ?? counter,
    ...config,
  };
}
